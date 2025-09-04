import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorHandlingService, ErrorType, ErrorSeverity, ErrorDetails } from '../services/ErrorHandlingService';

export interface UseErrorHandlerOptions {
  enableRetry?: boolean;
  maxRetries?: number;
  enableOfflineStorage?: boolean;
  onError?: (error: ErrorDetails) => void;
  onRetrySuccess?: () => void;
  onRetryFailure?: (error: Error) => void;
}

export interface UseErrorHandlerReturn {
  error: ErrorDetails | null;
  isRetrying: boolean;
  retryCount: number;
  isOnline: boolean;
  handleError: (error: Error, context?: any) => ErrorDetails;
  retry: () => Promise<void>;
  clearError: () => void;
  storeOfflineData: (type: 'progress' | 'navigation' | 'action', data: any, userId?: string) => void;
  getErrorStats: () => any;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const {
    enableRetry = true,
    maxRetries = 3,
    enableOfflineStorage = true,
    onError,
    onRetrySuccess,
    onRetryFailure
  } = options;

  const navigate = useNavigate();
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle errors
  const handleError = useCallback((error: Error, context?: any): ErrorDetails => {
    const errorDetails = errorHandlingService.handleError(error, context);
    setError(errorDetails);
    setRetryCount(0);

    // Call optional error callback
    if (onError) {
      onError(errorDetails);
    }

    // Handle specific error types
    switch (errorDetails.type) {
      case ErrorType.NAVIGATION:
        handleNavigationError(errorDetails);
        break;
      case ErrorType.AUTHENTICATION:
        handleAuthenticationError(errorDetails);
        break;
      case ErrorType.PROGRESS_UPDATE:
        if (enableOfflineStorage && !isOnline) {
          storeOfflineData('progress', context?.progressData, context?.userId);
        }
        break;
    }

    return errorDetails;
  }, [onError, enableOfflineStorage, isOnline, navigate]);

  // Handle navigation errors
  const handleNavigationError = useCallback((errorDetails: ErrorDetails) => {
    console.error('Navigation error:', errorDetails);
    
    // Try to navigate to a safe route
    try {
      navigate('/dashboard', { replace: true });
    } catch (navError) {
      // If navigation fails, reload the page
      window.location.href = '/dashboard';
    }
  }, [navigate]);

  // Handle authentication errors
  const handleAuthenticationError = useCallback((errorDetails: ErrorDetails) => {
    console.error('Authentication error:', errorDetails);
    
    // Clear user data and redirect to login
    localStorage.removeItem('userCache');
    sessionStorage.clear();
    
    try {
      navigate('/login', { replace: true });
    } catch (navError) {
      window.location.href = '/login';
    }
  }, [navigate]);

  // Retry failed operations
  const retry = useCallback(async (): Promise<void> => {
    if (!error || !enableRetry || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);

    try {
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Attempt to retry based on error type
      await retryOperation(error);

      // Success - clear error and call success callback
      setError(null);
      setRetryCount(0);
      
      if (onRetrySuccess) {
        onRetrySuccess();
      }

      console.log('✅ Retry successful for error:', error.type);
    } catch (retryError) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (onRetryFailure) {
        onRetryFailure(retryError as Error);
      }

      console.error(`❌ Retry ${newRetryCount} failed for error:`, error.type, retryError);

      // If max retries reached, handle accordingly
      if (newRetryCount >= maxRetries) {
        console.error('🚫 Max retries reached for error:', error.type);
        
        // Store data offline if possible
        if (enableOfflineStorage && error.context) {
          storeOfflineData('action', {
            action: 'retry_failed',
            data: error.context
          });
        }
      }
    } finally {
      setIsRetrying(false);
    }
  }, [error, enableRetry, retryCount, maxRetries, onRetrySuccess, onRetryFailure, enableOfflineStorage]);

  // Retry operation based on error type
  const retryOperation = async (errorDetails: ErrorDetails): Promise<void> => {
    switch (errorDetails.type) {
      case ErrorType.API:
        await retryAPIOperation(errorDetails);
        break;
      case ErrorType.PROGRESS_UPDATE:
        await retryProgressUpdate(errorDetails);
        break;
      case ErrorType.NETWORK:
        await retryNetworkOperation(errorDetails);
        break;
      default:
        throw new Error(`Retry not supported for error type: ${errorDetails.type}`);
    }
  };

  // Retry API operations
  const retryAPIOperation = async (errorDetails: ErrorDetails): Promise<void> => {
    if (!errorDetails.context?.apiCall) {
      throw new Error('No API call data available for retry');
    }

    const { url, options } = errorDetails.context.apiCall;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API retry failed: ${response.statusText}`);
    }
  };

  // Retry progress update operations
  const retryProgressUpdate = async (errorDetails: ErrorDetails): Promise<void> => {
    if (!errorDetails.context?.progressData) {
      throw new Error('No progress data available for retry');
    }

    const { userId, progress } = errorDetails.context.progressData;
    
    // Import optimized API dynamically to avoid circular dependencies
    const { optimizedAPI } = await import('../services/OptimizedAPI');
    const result = await optimizedAPI.updateLessonProgress(userId, progress);
    
    if (!result.success) {
      throw new Error(result.error || 'Progress update retry failed');
    }
  };

  // Retry network operations
  const retryNetworkOperation = async (errorDetails: ErrorDetails): Promise<void> => {
    // Simple connectivity check
    const response = await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error('Network connectivity check failed');
    }
  };

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  // Store data offline
  const storeOfflineData = useCallback((
    type: 'progress' | 'navigation' | 'action', 
    data: any, 
    userId?: string
  ) => {
    if (enableOfflineStorage) {
      errorHandlingService.storeOfflineData(type, data, userId);
    }
  }, [enableOfflineStorage]);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    return errorHandlingService.getErrorStats();
  }, []);

  return {
    error,
    isRetrying,
    retryCount,
    isOnline,
    handleError,
    retry,
    clearError,
    storeOfflineData,
    getErrorStats
  };
};