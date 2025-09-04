import { getAuth } from 'firebase/auth';
import { ApiResponse, UserProfile, LessonProgress } from './api';

// Cache interface for storing API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache configuration
const CACHE_DURATION = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  USER_PROGRESS: 2 * 60 * 1000, // 2 minutes
  ANALYTICS: 10 * 60 * 1000, // 10 minutes
} as const;

// In-memory cache for API responses
class APICache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, duration: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + duration,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const apiCache = new APICache();

// Base API configuration
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API timeout configuration
const API_TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000,  // 30 seconds
  BATCH: 15000,   // 15 seconds
} as const;

// Enhanced fetch with timeout and error handling
async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout: number = API_TIMEOUTS.DEFAULT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

// Batch operation queue for progress updates
interface BatchProgressUpdate {
  userId: string;
  updates: LessonProgress[];
  timestamp: number;
}

class BatchProgressManager {
  private queue = new Map<string, BatchProgressUpdate>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 2000; // 2 seconds
  private readonly MAX_BATCH_SIZE = 10;

  addUpdate(userId: string, progress: LessonProgress): void {
    const existing = this.queue.get(userId);
    if (existing) {
      existing.updates.push(progress);
      existing.timestamp = Date.now();
    } else {
      this.queue.set(userId, {
        userId,
        updates: [progress],
        timestamp: Date.now(),
      });
    }

    // If batch is full, process immediately
    if (existing && existing.updates.length >= this.MAX_BATCH_SIZE) {
      this.processBatch(userId);
      return;
    }

    // Schedule batch processing
    this.scheduleBatchProcessing();
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processAllBatches();
    }, this.BATCH_DELAY);
  }

  private async processBatch(userId: string): Promise<void> {
    const batch = this.queue.get(userId);
    if (!batch) return;

    this.queue.delete(userId);

    try {
      await this.sendBatchUpdate(batch);
      console.log(`Batch processed for user ${userId}: ${batch.updates.length} updates`);
    } catch (error) {
      console.error('Batch processing failed:', error);
      // Re-queue failed updates (could implement retry logic here)
    }
  }

  private async processAllBatches(): Promise<void> {
    const userIds = Array.from(this.queue.keys());
    await Promise.all(userIds.map(userId => this.processBatch(userId)));
  }

  private async sendBatchUpdate(batch: BatchProgressUpdate): Promise<void> {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(`${API_BASE_URL}/progress/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: batch.userId,
        updates: batch.updates,
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch update failed: ${response.statusText}`);
    }

    // Invalidate related cache entries
    apiCache.invalidatePattern(`progress_${batch.userId}`);
    apiCache.invalidatePattern(`profile_${batch.userId}`);
  }

  // Force process all pending batches (useful for page unload)
  async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.processAllBatches();
  }
}

// Global batch manager instance
const batchProgressManager = new BatchProgressManager();

// Optimized API service with caching and batching
export const optimizedAPI = {
  // Enhanced user profile fetching with caching and error handling
  async getUserProfile(userId: string, forceRefresh = false): Promise<ApiResponse<UserProfile>> {
    const cacheKey = `profile_${userId}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = apiCache.get<UserProfile>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Profile loaded from cache',
        };
      }
    }

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }, API_TIMEOUTS.DEFAULT);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please log in again');
        } else if (response.status === 404) {
          throw new Error('User profile not found');
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again later');
        }
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json() as UserProfile;
      
      // Cache the result
      apiCache.set(cacheKey, data, CACHE_DURATION.USER_PROFILE);

      return {
        success: true,
        data,
        message: 'Profile fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            success: false,
            error: 'Request timed out - please check your connection and try again',
          };
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return {
            success: false,
            error: 'Network error - please check your internet connection',
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  // Enhanced progress fetching with caching and error handling
  async getUserProgress(userId: string, forceRefresh = false): Promise<ApiResponse<any>> {
    const cacheKey = `progress_${userId}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = apiCache.get<any>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Progress loaded from cache',
        };
      }
    }

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/progress/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }, API_TIMEOUTS.DEFAULT);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please log in again');
        } else if (response.status === 404) {
          // Return empty progress for new users
          const emptyProgress = {};
          apiCache.set(cacheKey, emptyProgress, CACHE_DURATION.USER_PROGRESS);
          return {
            success: true,
            data: emptyProgress,
            message: 'New user - empty progress initialized',
          };
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again later');
        }
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      apiCache.set(cacheKey, data, CACHE_DURATION.USER_PROGRESS);

      return {
        success: true,
        data,
        message: 'Progress fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching progress:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            success: false,
            error: 'Request timed out - please check your connection and try again',
          };
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return {
            success: false,
            error: 'Network error - please check your internet connection',
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  // Batched progress update
  async updateLessonProgress(userId: string, progress: LessonProgress): Promise<ApiResponse<void>> {
    try {
      // Add to batch queue instead of immediate API call
      batchProgressManager.addUpdate(userId, progress);

      // Optimistically update cache
      const cacheKey = `progress_${userId}`;
      const cachedProgress = apiCache.get<any>(cacheKey);
      if (cachedProgress) {
        if (!cachedProgress[progress.moduleId]) {
          cachedProgress[progress.moduleId] = {};
        }
        cachedProgress[progress.moduleId][progress.topicId] = progress;
        apiCache.set(cacheKey, cachedProgress, CACHE_DURATION.USER_PROGRESS);
      }

      return {
        success: true,
        message: 'Progress update queued for batch processing',
      };
    } catch (error) {
      console.error('Error queuing progress update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Enhanced analytics with caching
  async getUserStats(userId: string, forceRefresh = false): Promise<ApiResponse<any>> {
    const cacheKey = `analytics_${userId}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = apiCache.get<any>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Analytics loaded from cache',
        };
      }
    }

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/analytics/user-stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      apiCache.set(cacheKey, data, CACHE_DURATION.ANALYTICS);

      return {
        success: true,
        data,
        message: 'Analytics fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Cache management utilities
  cache: {
    invalidateUser(userId: string): void {
      apiCache.invalidatePattern(userId);
    },

    invalidateProgress(userId: string): void {
      apiCache.invalidate(`progress_${userId}`);
    },

    invalidateProfile(userId: string): void {
      apiCache.invalidate(`profile_${userId}`);
    },

    clear(): void {
      apiCache.clear();
    },

    getStats(): { size: number } {
      return { size: apiCache.size() };
    },
  },

  // Batch management utilities
  batch: {
    async flush(): Promise<void> {
      await batchProgressManager.flush();
    },
  },
};

// Hook for optimized data fetching
export const useOptimizedAPI = () => {
  return {
    ...optimizedAPI,
    
    // Preload data for better UX
    async preloadUserData(userId: string): Promise<void> {
      try {
        await Promise.all([
          optimizedAPI.getUserProfile(userId),
          optimizedAPI.getUserProgress(userId),
          optimizedAPI.getUserStats(userId),
        ]);
      } catch (error) {
        console.error('Error preloading user data:', error);
      }
    },

    // Refresh all user data
    async refreshUserData(userId: string): Promise<void> {
      try {
        await Promise.all([
          optimizedAPI.getUserProfile(userId, true),
          optimizedAPI.getUserProgress(userId, true),
          optimizedAPI.getUserStats(userId, true),
        ]);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    },
  };
};

// Cleanup function for page unload
export const cleanupOptimizedAPI = async (): Promise<void> => {
  await batchProgressManager.flush();
};

// Setup cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupOptimizedAPI);
  window.addEventListener('pagehide', cleanupOptimizedAPI);
}

export default optimizedAPI;