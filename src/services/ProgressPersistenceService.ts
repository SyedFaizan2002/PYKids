/**
 * Progress Persistence Service
 * 
 * Handles progress data persistence with offline support, retry logic, and data integrity.
 * This service ensures user progress is never lost and provides reliable synchronization
 * across sessions and devices.
 */

import { progressAPI, userAPI } from './api';

export interface ProgressUpdate {
  userId: string;
  moduleId: string;
  topicId: string;
  completed: boolean;
  score: number;
  timestamp: string;
  synced: boolean;
  type: 'lesson' | 'quiz';
}

export interface PendingUpdate {
  id: string;
  update: ProgressUpdate;
  retryCount: number;
  lastAttempt: string;
  priority: 'high' | 'normal' | 'low';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class ProgressPersistenceService {
  private readonly STORAGE_KEY = 'pykids_pending_updates';
  private readonly SYNC_STATUS_KEY = 'pykids_sync_status';
  private readonly LAST_SYNC_KEY = 'pykids_last_sync';
  
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 5,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2
  };

  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;
  private statusCallbacks: ((status: SyncStatus) => void)[] = [];

  /**
   * Initialize the persistence service
   */
  async initialize(): Promise<void> {
    console.log('Initializing Progress Persistence Service...');
    
    try {
      // Set up online/offline listeners
      this.setupNetworkListeners();
      
      // Set up periodic sync
      this.setupPeriodicSync();
      
      // Sync any pending updates from previous sessions
      await this.syncPendingUpdates();
      
      console.log('Progress Persistence Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Progress Persistence Service:', error);
      throw error;
    }
  }

  /**
   * Save progress update with offline support and retry logic
   */
  async saveProgress(
    userId: string,
    moduleId: string,
    topicId: string,
    completed: boolean,
    score: number,
    type: 'lesson' | 'quiz' = 'lesson'
  ): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required for progress updates');
    }

    const update: ProgressUpdate = {
      userId,
      moduleId,
      topicId,
      completed,
      score,
      type,
      timestamp: new Date().toISOString(),
      synced: false
    };

    console.log('Saving progress update:', update);

    try {
      // Try immediate sync if online
      if (navigator.onLine) {
        await this.syncUpdate(update);
        update.synced = true;
        console.log('Progress update synced immediately');
        
        // Update sync status
        this.updateSyncStatus({
          isOnline: true,
          isSyncing: false,
          pendingCount: this.getPendingUpdateCount(),
          lastSyncTime: new Date().toISOString(),
          lastError: null
        });
      } else {
        throw new Error('Offline - queuing for later sync');
      }
    } catch (error) {
      console.warn('Immediate sync failed, queuing for later:', error);
      
      // Queue for later sync
      this.queueUpdate(update);
      
      // Update sync status
      this.updateSyncStatus({
        isOnline: navigator.onLine,
        isSyncing: false,
        pendingCount: this.getPendingUpdateCount(),
        lastSyncTime: this.getLastSyncTime(),
        lastError: error instanceof Error ? error.message : 'Sync failed'
      });
    }

    // Broadcast update to other tabs
    this.broadcastProgressUpdate(update);
  }

  /**
   * Sync all pending updates
   */
  async syncPendingUpdates(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return;
    }

    if (!navigator.onLine) {
      console.log('Offline, skipping sync');
      return;
    }

    this.syncInProgress = true;
    const pendingUpdates = this.getPendingUpdates();
    
    if (pendingUpdates.length === 0) {
      this.syncInProgress = false;
      return;
    }

    console.log(`Syncing ${pendingUpdates.length} pending updates`);
    
    // Update sync status
    this.updateSyncStatus({
      isOnline: true,
      isSyncing: true,
      pendingCount: pendingUpdates.length,
      lastSyncTime: this.getLastSyncTime(),
      lastError: null
    });

    const remainingUpdates: PendingUpdate[] = [];
    let syncedCount = 0;
    let errorCount = 0;

    // Sort by priority and timestamp
    const sortedUpdates = pendingUpdates.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.update.timestamp).getTime() - new Date(b.update.timestamp).getTime();
    });

    for (const pendingUpdate of sortedUpdates) {
      try {
        await this.syncUpdate(pendingUpdate.update);
        syncedCount++;
        console.log(`Successfully synced update: ${pendingUpdate.id}`);
      } catch (error) {
        errorCount++;
        console.error(`Failed to sync update ${pendingUpdate.id}:`, error);
        
        // Increment retry count
        pendingUpdate.retryCount++;
        pendingUpdate.lastAttempt = new Date().toISOString();
        
        // Keep for retry if under max retries
        if (pendingUpdate.retryCount < this.DEFAULT_RETRY_CONFIG.maxRetries) {
          remainingUpdates.push(pendingUpdate);
        } else {
          console.error(`Max retries exceeded for update ${pendingUpdate.id}, discarding`);
        }
      }
    }

    // Save remaining updates
    this.savePendingUpdates(remainingUpdates);
    
    // Update sync status
    this.updateSyncStatus({
      isOnline: true,
      isSyncing: false,
      pendingCount: remainingUpdates.length,
      lastSyncTime: syncedCount > 0 ? new Date().toISOString() : this.getLastSyncTime(),
      lastError: errorCount > 0 ? `${errorCount} updates failed to sync` : null
    });

    this.syncInProgress = false;
    
    console.log(`Sync completed: ${syncedCount} synced, ${errorCount} failed, ${remainingUpdates.length} remaining`);
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    try {
      const stored = localStorage.getItem(this.SYNC_STATUS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading sync status:', error);
    }

    return {
      isOnline: navigator.onLine,
      isSyncing: false,
      pendingCount: this.getPendingUpdateCount(),
      lastSyncTime: null,
      lastError: null
    };
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get count of pending updates
   */
  getPendingUpdateCount(): number {
    return this.getPendingUpdates().length;
  }

  /**
   * Clear all pending updates (use with caution)
   */
  clearPendingUpdates(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateSyncStatus({
      ...this.getSyncStatus(),
      pendingCount: 0
    });
  }

  /**
   * Force sync now (manual trigger)
   */
  async forceSyncNow(): Promise<void> {
    console.log('Force sync triggered');
    await this.syncPendingUpdates();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }

    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
      this.offlineListener = null;
    }

    this.statusCallbacks = [];
  }

  // Private methods

  private async syncUpdate(update: ProgressUpdate): Promise<void> {
    try {
      // Get current user progress to merge with update
      const profileResponse = await userAPI.getUserProfile(update.userId);
      
      if (!profileResponse.success || !profileResponse.data) {
        throw new Error('Failed to fetch user profile for progress merge');
      }

      const currentProfile = profileResponse.data;
      
      // Merge the update with current progress
      const updatedProgress = {
        ...currentProfile.progress,
        [update.moduleId]: {
          ...currentProfile.progress[update.moduleId],
          [update.topicId]: {
            completed: update.completed,
            score: update.score,
            completedAt: update.completed ? update.timestamp : undefined,
            type: update.type
          }
        }
      };

      // Calculate new totals
      let completedLessons = 0;
      let completedQuizzes = 0;
      let totalScore = 0;

      Object.entries(updatedProgress).forEach(([modId, module]) => {
        Object.entries(module as any).forEach(([topId, item]: [string, any]) => {
          if (item.completed) {
            if (item.type === 'quiz' || topId === 'quiz') {
              completedQuizzes++;
            } else {
              completedLessons++;
            }
            totalScore += item.score || 0;
          }
        });
      });

      // Prepare profile update
      const profileUpdate = {
        progress: updatedProgress,
        totalScore,
        lastActiveLesson: {
          moduleId: update.moduleId,
          topicId: update.topicId
        },
        // Add computed fields for easier dashboard access
        completedLessons,
        completedQuizzes,
        updatedAt: update.timestamp
      };

      // Update backend
      const updateResponse = await userAPI.updateUserProfile(update.userId, profileUpdate);
      
      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to update user profile');
      }

      console.log('Progress update synced successfully:', update);
      
    } catch (error) {
      console.error('Failed to sync progress update:', error);
      throw error;
    }
  }

  private queueUpdate(update: ProgressUpdate): void {
    const pendingUpdates = this.getPendingUpdates();
    const pendingUpdate: PendingUpdate = {
      id: `${update.userId}_${update.moduleId}_${update.topicId}_${Date.now()}`,
      update,
      retryCount: 0,
      lastAttempt: new Date().toISOString(),
      priority: update.type === 'quiz' ? 'high' : 'normal'
    };

    pendingUpdates.push(pendingUpdate);
    this.savePendingUpdates(pendingUpdates);
    
    console.log('Progress update queued for later sync:', pendingUpdate.id);
  }

  private getPendingUpdates(): PendingUpdate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading pending updates:', error);
      return [];
    }
  }

  private savePendingUpdates(updates: PendingUpdate[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updates));
    } catch (error) {
      console.error('Error saving pending updates:', error);
    }
  }

  private updateSyncStatus(status: SyncStatus): void {
    try {
      localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(status));
      
      // Notify subscribers
      this.statusCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in sync status callback:', error);
        }
      });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  private getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(this.LAST_SYNC_KEY);
    } catch (error) {
      console.error('Error reading last sync time:', error);
      return null;
    }
  }

  private setupNetworkListeners(): void {
    this.onlineListener = () => {
      console.log('Network back online, syncing pending updates');
      this.updateSyncStatus({
        ...this.getSyncStatus(),
        isOnline: true,
        lastError: null
      });
      this.syncPendingUpdates();
    };

    this.offlineListener = () => {
      console.log('Network went offline');
      this.updateSyncStatus({
        ...this.getSyncStatus(),
        isOnline: false,
        isSyncing: false
      });
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  private setupPeriodicSync(): void {
    // Sync every 2 minutes
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && this.getPendingUpdateCount() > 0) {
        console.log('Periodic sync triggered');
        this.syncPendingUpdates();
      }
    }, 120000);
  }

  private broadcastProgressUpdate(update: ProgressUpdate): void {
    try {
      // Use localStorage event to communicate across tabs
      const broadcastData = {
        type: 'progress_update',
        update,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pykids_progress_broadcast', JSON.stringify(broadcastData));
      
      // Clean up broadcast data after a short delay
      setTimeout(() => {
        localStorage.removeItem('pykids_progress_broadcast');
      }, 1000);
    } catch (error) {
      console.error('Error broadcasting progress update:', error);
    }
  }
}

// Export singleton instance
export const progressPersistenceService = new ProgressPersistenceService();

export default progressPersistenceService;