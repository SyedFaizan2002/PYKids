import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { optimizedAPI } from '../services/OptimizedAPI';
import { LessonProgress, userAPI } from '../services/api';
import { progressAnalyticsService, ProgressAnalytics } from '../services/ProgressAnalytics';
import { progressPersistenceService, SyncStatus } from '../services/ProgressPersistenceService';

export interface NavigationHistoryEntry {
  moduleId: string;
  topicId: string;
  timestamp: string;
  completionStatus: 'started' | 'completed' | 'reviewed';
}

export interface UserData {
  id?: string;
  email?: string;
  selectedAvatar?: string;
  progress: {
    [moduleId: string]: {
      [topicId: string]: {
        completed: boolean;
        score?: number;
        completedAt?: string;
      };
    };
  };
  totalScore: number;
  lastActiveLesson?: {
    moduleId: string;
    topicId: string;
  };
  navigationHistory?: NavigationHistoryEntry[];
}

interface UserContextType {
  userData: UserData | null;
  updateUserProgress: (moduleId: string, topicId: string, completed: boolean, score?: number, type?: 'lesson' | 'quiz') => Promise<void>;
  batchUpdateProgress: (updates: Array<{ moduleId: string; topicId: string; completed: boolean; score?: number; type?: 'lesson' | 'quiz' }>) => Promise<void>;
  setSelectedAvatar: (avatarId: string) => Promise<void>;
  loading: boolean;
  refreshUserData: (forceRefresh?: boolean) => Promise<void>;
  forceRefreshProgress: () => Promise<void>;
  syncProgress: () => Promise<void>;
  cacheStats: { size: number };
  getProgressAnalytics: () => ProgressAnalytics;
  getNavigationHistory: () => NavigationHistoryEntry[];
  updateLastActiveLesson: (moduleId: string, topicId: string) => Promise<void>;
  optimizedProgressUpdate: (updates: Array<{ moduleId: string; topicId: string; completed: boolean; score?: number; type?: 'lesson' | 'quiz' }>) => Promise<void>;
  syncStatus: SyncStatus;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

const UserProviderComponent = ({ children }: UserProviderProps) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null
  });

  // Enhanced data loading with persistence service integration
  const loadUserData = useCallback(async (forceRefresh = false) => {
    if (!currentUser) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Use direct API call for more reliable data fetching
      const profileResponse = await userAPI.getUserProfile(currentUser.uid);

      if (profileResponse.success && profileResponse.data) {
        const profile = profileResponse.data;

        setUserData({
          id: profile.id,
          email: profile.email,
          selectedAvatar: profile.selectedAvatar,
          progress: profile.progress || {},
          totalScore: profile.totalScore || 0,
          lastActiveLesson: profile.lastActiveLesson,
          navigationHistory: profile.navigationHistory || [],
        });
        
        // Initialize navigation history if it exists
        if (profile.navigationHistory) {
          setNavigationHistory(profile.navigationHistory);
        }

        console.log('User data loaded successfully:', {
          userId: profile.id,
          totalScore: profile.totalScore,
          completedLessons: Object.values(profile.progress || {}).reduce((total, module) => 
            total + Object.values(module).filter((lesson: any) => lesson.completed).length, 0
          ),
          lastActiveLesson: profile.lastActiveLesson
        });
      } else {
        console.error('Failed to load user profile:', profileResponse.error);
        // Set default structure for new users
        setUserData({
          id: currentUser.uid,
          email: currentUser.email || '',
          progress: {},
          totalScore: 0,
          lastActiveLesson: undefined,
          navigationHistory: [],
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set default structure on error
      setUserData({
        id: currentUser.uid,
        email: currentUser.email || '',
        progress: {},
        totalScore: 0,
        lastActiveLesson: undefined,
        navigationHistory: [],
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Initialize progress persistence service when user changes
  useEffect(() => {
    if (currentUser) {
      progressPersistenceService.initialize().catch(error => {
        console.error('Failed to initialize progress persistence service:', error);
      });

      // Subscribe to sync status changes
      const unsubscribe = progressPersistenceService.onSyncStatusChange(setSyncStatus);

      // Set up cross-tab sync listener
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'pykids_progress_broadcast') {
          console.log('Progress update detected from another tab, syncing...');
          syncProgress();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [currentUser]);

  const refreshUserData = useCallback(async (forceRefresh = false) => {
    if (currentUser) {
      await loadUserData(forceRefresh);
    }
  }, [currentUser, loadUserData]);

  // Force refresh from backend (for dashboard mount)
  const forceRefreshProgress = useCallback(async () => {
    console.log('Force refreshing progress data from backend...');
    await refreshUserData(true);
  }, [refreshUserData]);

  // Sync progress with persistence service
  const syncProgress = useCallback(async () => {
    try {
      await progressPersistenceService.forceSyncNow();
      // Refresh user data after sync to get latest state
      await refreshUserData(true);
    } catch (error) {
      console.error('Error syncing progress:', error);
    }
  }, [refreshUserData]);

  const setSelectedAvatar = useCallback(async (avatarId: string) => {
    try {
      // Input validation
      if (!avatarId || typeof avatarId !== 'string') {
        throw new Error('Invalid avatarId');
      }

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Optimistic update
      setUserData(prev => prev ? { ...prev, selectedAvatar: avatarId } : null);

      // This would use the optimized API for avatar updates
      // For now, keeping the direct API call but could be optimized
      const response = await optimizedAPI.getUserProfile(currentUser.uid);
      if (response.success && response.data) {
        // Update cache with new avatar
        optimizedAPI.cache.invalidateProfile(currentUser.uid);
      }
    } catch (error) {
      console.error('Error setting avatar:', error);
      // Revert optimistic update on error
      if (currentUser) {
        await loadUserData(true);
      }
      throw error; // Re-throw to allow caller to handle
    }
  }, [currentUser, loadUserData]);

  // Progress analytics integration
  const getProgressAnalytics = useCallback((): ProgressAnalytics => {
    if (!userData) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        completionPercentage: 0,
        lastActiveLesson: null,
        moduleProgress: []
      };
    }
    return progressAnalyticsService.calculateProgressAnalytics(userData);
  }, [userData]);

  // Navigation history tracking
  const getNavigationHistory = useCallback((): NavigationHistoryEntry[] => {
    return navigationHistory;
  }, [navigationHistory]);

  // Add navigation history entry
  const addNavigationHistoryEntry = useCallback((moduleId: string, topicId: string, status: NavigationHistoryEntry['completionStatus']) => {
    const entry: NavigationHistoryEntry = {
      moduleId,
      topicId,
      timestamp: new Date().toISOString(),
      completionStatus: status
    };

    setNavigationHistory(prev => {
      // Remove any existing entry for the same lesson to avoid duplicates
      const filtered = prev.filter(item => !(item.moduleId === moduleId && item.topicId === topicId));
      // Add new entry at the beginning (most recent first)
      return [entry, ...filtered].slice(0, 50); // Keep only last 50 entries
    });
  }, []);

  // Optimized batch progress updates with debouncing
  const [pendingUpdates, setPendingUpdates] = useState<Array<{ moduleId: string; topicId: string; completed: boolean; score?: number }>>([]);
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Enhanced progress update using persistence service
  const optimizedProgressUpdate = useCallback(async (updates: Array<{ moduleId: string; topicId: string; completed: boolean; score?: number; type?: 'lesson' | 'quiz' }>) => {
    // Input validation
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      console.warn('optimizedProgressUpdate: Invalid updates array');
      return;
    }

    if (!currentUser) {
      console.error('optimizedProgressUpdate: User not authenticated');
      throw new Error('User not authenticated');
    }

    if (!userData) {
      console.error('optimizedProgressUpdate: User data not loaded');
      throw new Error('User data not loaded');
    }

    try {
      // Apply optimistic updates immediately for better UX
      let updatedProgress = { ...userData.progress };
      let updatedTotalScore = userData.totalScore;
      let updatedLastActiveLesson = userData.lastActiveLesson;

      for (const update of updates) {
        const { moduleId, topicId, completed, score = 10, type = 'lesson' } = update;
        
        // Validate update data
        if (!moduleId || !topicId) {
          console.warn('optimizedProgressUpdate: Invalid moduleId or topicId', update);
          continue;
        }

        if (typeof completed !== 'boolean') {
          console.warn('optimizedProgressUpdate: Invalid completed value', update);
          continue;
        }
        
        if (!updatedProgress[moduleId]) {
          updatedProgress[moduleId] = {};
        }

        const wasCompleted = updatedProgress[moduleId][topicId]?.completed || false;
        
        updatedProgress[moduleId][topicId] = {
          completed,
          score: completed ? score : updatedProgress[moduleId][topicId]?.score || 0,
          completedAt: completed ? new Date().toISOString() : updatedProgress[moduleId][topicId]?.completedAt
        };

        // Only add score if lesson wasn't previously completed
        if (completed && !wasCompleted) {
          updatedTotalScore += score;
        }

        updatedLastActiveLesson = { moduleId, topicId };
        
        // Add to navigation history
        addNavigationHistoryEntry(moduleId, topicId, completed ? 'completed' : 'started');
      }

      // Update state immediately (optimistic update)
      setUserData({
        ...userData,
        progress: updatedProgress,
        totalScore: updatedTotalScore,
        lastActiveLesson: updatedLastActiveLesson
      });

      // Use persistence service for reliable saving
      const savePromises = updates.map(update => 
        progressPersistenceService.saveProgress(
          currentUser.uid,
          update.moduleId,
          update.topicId,
          update.completed,
          update.score || 10,
          update.type || 'lesson'
        )
      );

      // Wait for all saves to complete
      await Promise.all(savePromises);

      console.log('All progress updates saved successfully');

    } catch (error) {
      console.error('Error in optimized progress update:', error);
      
      // Revert optimistic updates on error
      await loadUserData(true);
      
      // Re-throw error for handling by calling component
      throw error;
    }
  }, [currentUser, userData, loadUserData, addNavigationHistoryEntry]);

  // Enhanced single progress update with persistence service
  const updateUserProgress = useCallback(async (moduleId: string, topicId: string, completed: boolean, score = 10, type: 'lesson' | 'quiz' = 'lesson') => {
    try {
      // Input validation
      if (!moduleId || !topicId) {
        throw new Error('Invalid moduleId or topicId');
      }
      if (typeof completed !== 'boolean') {
        throw new Error('Invalid completed value');
      }
      
      console.log('Updating user progress:', { moduleId, topicId, completed, score, type });
      
      return await optimizedProgressUpdate([{ moduleId, topicId, completed, score, type }]);
    } catch (error) {
      console.error('Error in updateUserProgress:', error);
      throw error;
    }
  }, [optimizedProgressUpdate]);

  // Enhanced batch progress updates with persistence service
  const batchUpdateProgress = useCallback(async (updates: Array<{ moduleId: string; topicId: string; completed: boolean; score?: number; type?: 'lesson' | 'quiz' }>) => {
    try {
      // Input validation
      if (!updates || !Array.isArray(updates)) {
        throw new Error('Invalid updates array');
      }
      
      console.log('Batch updating progress:', updates);
      
      return await optimizedProgressUpdate(updates);
    } catch (error) {
      console.error('Error in batchUpdateProgress:', error);
      throw error;
    }
  }, [optimizedProgressUpdate]);

  // Update last active lesson with navigation history tracking
  const updateLastActiveLesson = useCallback(async (moduleId: string, topicId: string) => {
    try {
      // Input validation
      if (!moduleId || !topicId) {
        throw new Error('Invalid moduleId or topicId');
      }

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (!userData) {
        throw new Error('User data not loaded');
      }

      // Update local state optimistically
      setUserData(prev => prev ? {
        ...prev,
        lastActiveLesson: { moduleId, topicId }
      } : null);

      // Add to navigation history
      addNavigationHistoryEntry(moduleId, topicId, 'started');

      // Update backend (this would need to be implemented in the API)
      // For now, we'll use the existing progress update mechanism
      // In a real implementation, this would be a separate API call
      
    } catch (error) {
      console.error('Error updating last active lesson:', error);
      // Revert optimistic update on error
      if (currentUser) {
        await loadUserData(true);
      }
      throw error; // Re-throw to allow caller to handle
    }
  }, [currentUser, userData, loadUserData, addNavigationHistoryEntry]);

  // Get cache statistics for debugging/monitoring
  const cacheStats = useMemo(() => optimizedAPI.cache.getStats(), []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    userData,
    updateUserProgress,
    batchUpdateProgress,
    setSelectedAvatar,
    loading,
    refreshUserData,
    forceRefreshProgress,
    syncProgress,
    cacheStats,
    getProgressAnalytics,
    getNavigationHistory,
    updateLastActiveLesson,
    optimizedProgressUpdate,
    syncStatus,
  }), [
    userData,
    updateUserProgress,
    batchUpdateProgress,
    setSelectedAvatar,
    loading,
    refreshUserData,
    forceRefreshProgress,
    syncProgress,
    cacheStats,
    getProgressAnalytics,
    getNavigationHistory,
    updateLastActiveLesson,
    optimizedProgressUpdate,
    syncStatus,
  ]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Error boundary specifically for UserContext
class UserContextErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UserContext Error:', error, errorInfo);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md mx-4">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-2xl font-bold text-white mb-4">User Data Loading Error</h2>
            <p className="text-purple-200 mb-6">
              We're having trouble loading your progress. Let's try to fix this!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Clear user data cache and reload
                  localStorage.removeItem('userCache');
                  sessionStorage.clear();
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                🔄 Reset User Data
              </button>
              <button
                onClick={() => {
                  // Try to recover by resetting state
                  this.setState({ hasError: false });
                }}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                🚀 Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-red-300 cursor-pointer text-sm">
                  🐛 Error Details
                </summary>
                <pre className="mt-2 p-3 bg-red-900/20 rounded text-red-200 text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Memoize the UserProvider to prevent unnecessary re-renders
const MemoizedUserProvider = React.memo(UserProviderComponent);

// Export UserProvider wrapped with error boundary
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UserContextErrorBoundary>
    <MemoizedUserProvider>{children}</MemoizedUserProvider>
  </UserContextErrorBoundary>
);