import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedAPI } from '../services/OptimizedAPI';
import { UserProfile } from '../services/api';

// Hook for optimized user profile fetching
export const useOptimizedUserProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!userId) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await optimizedAPI.getUserProfile(userId, forceRefresh);
      
      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (response.success && response.data) {
        setProfile(response.data);
        setLastFetch(Date.now());
      } else {
        setError(response.error || 'Failed to fetch profile');
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  const refreshProfile = useCallback(() => {
    return fetchProfile(true);
  }, [fetchProfile]);

  // Auto-fetch on userId change
  useEffect(() => {
    if (userId) {
      fetchProfile();
    } else {
      setProfile(null);
      setError(null);
    }

    // Cleanup on unmount or userId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    lastFetch,
    refetch: fetchProfile,
    refresh: refreshProfile,
  };
};

// Hook for optimized user progress fetching
export const useOptimizedUserProgress = (userId: string | null) => {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProgress = useCallback(async (forceRefresh = false) => {
    if (!userId) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await optimizedAPI.getUserProgress(userId, forceRefresh);
      
      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (response.success) {
        setProgress(response.data || {});
        setLastFetch(Date.now());
      } else {
        setError(response.error || 'Failed to fetch progress');
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  const refreshProgress = useCallback(() => {
    return fetchProgress(true);
  }, [fetchProgress]);

  // Auto-fetch on userId change
  useEffect(() => {
    if (userId) {
      fetchProgress();
    } else {
      setProgress(null);
      setError(null);
    }

    // Cleanup on unmount or userId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchProgress]);

  return {
    progress,
    loading,
    error,
    lastFetch,
    refetch: fetchProgress,
    refresh: refreshProgress,
  };
};

// Hook for optimized analytics fetching
export const useOptimizedAnalytics = (userId: string | null) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAnalytics = useCallback(async (forceRefresh = false) => {
    if (!userId) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await optimizedAPI.getUserStats(userId, forceRefresh);
      
      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (response.success) {
        setAnalytics(response.data || {});
        setLastFetch(Date.now());
      } else {
        setError(response.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Auto-fetch on userId change
  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    } else {
      setAnalytics(null);
      setError(null);
    }

    // Cleanup on unmount or userId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    lastFetch,
    refetch: fetchAnalytics,
    refresh: refreshAnalytics,
  };
};

// Combined hook for all user data with intelligent loading
export const useOptimizedUserData = (userId: string | null) => {
  const profile = useOptimizedUserProfile(userId);
  const progress = useOptimizedUserProgress(userId);
  const analytics = useOptimizedAnalytics(userId);

  const isLoading = profile.loading || progress.loading || analytics.loading;
  const hasError = profile.error || progress.error || analytics.error;
  const errors = [profile.error, progress.error, analytics.error].filter(Boolean);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      profile.refresh(),
      progress.refresh(),
      analytics.refresh(),
    ]);
  }, [profile.refresh, progress.refresh, analytics.refresh]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      profile.refetch(),
      progress.refetch(),
      analytics.refetch(),
    ]);
  }, [profile.refetch, progress.refetch, analytics.refetch]);

  return {
    profile: profile.profile,
    progress: progress.progress,
    analytics: analytics.analytics,
    loading: {
      profile: profile.loading,
      progress: progress.loading,
      analytics: analytics.loading,
      any: isLoading,
    },
    error: {
      profile: profile.error,
      progress: progress.error,
      analytics: analytics.error,
      any: hasError,
      all: errors,
    },
    lastFetch: {
      profile: profile.lastFetch,
      progress: progress.lastFetch,
      analytics: analytics.lastFetch,
    },
    actions: {
      refreshAll,
      refetchAll,
      refreshProfile: profile.refresh,
      refreshProgress: progress.refresh,
      refreshAnalytics: analytics.refresh,
    },
  };
};

// Hook for debounced API calls
export const useDebouncedAPI = <T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  delay: number = 300
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedCall = useCallback((...args: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setError(null);
      setLoading(true);

      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await apiFunction(...args);
          
          if (!abortControllerRef.current?.signal.aborted) {
            setLoading(false);
            resolve(result);
          }
        } catch (err) {
          if (!abortControllerRef.current?.signal.aborted) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            setLoading(false);
            reject(err);
          }
        }
      }, delay);
    });
  }, [apiFunction, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    call: debouncedCall,
    loading,
    error,
  };
};