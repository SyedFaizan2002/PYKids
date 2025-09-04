import React, { ReactNode } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorType, ErrorSeverity } from '../services/ErrorHandlingService';

interface ErrorHandlerProps {
  children: ReactNode;
  fallback?: ReactNode;
  showRetryButton?: boolean;
  showOfflineIndicator?: boolean;
  enableAutoRetry?: boolean;
  maxRetries?: number;
  onError?: (error: any) => void;
  onRetrySuccess?: () => void;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  children,
  fallback,
  showRetryButton = true,
  showOfflineIndicator = true,
  enableAutoRetry = false,
  maxRetries = 3,
  onError,
  onRetrySuccess
}) => {
  const {
    error,
    isRetrying,
    retryCount,
    isOnline,
    retry,
    clearError
  } = useErrorHandler({
    enableRetry: showRetryButton,
    maxRetries,
    onError,
    onRetrySuccess
  });

  // Auto-retry for certain error types
  React.useEffect(() => {
    if (enableAutoRetry && error && error.retryable && retryCount === 0) {
      const autoRetryDelay = 2000; // 2 seconds
      const timeoutId = setTimeout(() => {
        retry();
      }, autoRetryDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [error, enableAutoRetry, retryCount, retry]);

  // Show offline indicator
  if (showOfflineIndicator && !isOnline && !error) {
    return (
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50">
          📴 You're offline. Some features may not work properly.
          {isOnline && (
            <span className="ml-2 text-green-800">
              ✅ Connection restored!
            </span>
          )}
        </div>
        <div className="pt-10">
          {children}
        </div>
      </div>
    );
  }

  // Show error UI if there's an error
  if (error) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default error UI
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">
            {getErrorIcon(error.type)}
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {getErrorTitle(error.type)}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {getErrorMessage(error)}
          </p>

          {/* Retry information */}
          {retryCount > 0 && (
            <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-4">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {showRetryButton && error.retryable && retryCount < maxRetries && (
              <button
                onClick={retry}
                disabled={isRetrying}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isRetrying ? '🔄 Retrying...' : '🔄 Try Again'}
              </button>
            )}
            
            <button
              onClick={clearError}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              ✖️ Dismiss
            </button>
          </div>

          {/* Development info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-red-600 cursor-pointer text-sm">
                🐛 Developer Info
              </summary>
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200 text-xs">
                <div className="mb-2">
                  <strong>Type:</strong> {error.type}
                </div>
                <div className="mb-2">
                  <strong>Severity:</strong> {error.severity}
                </div>
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}
                </div>
                {error.context && (
                  <div>
                    <strong>Context:</strong>
                    <pre className="mt-1 overflow-auto max-h-32">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // No error - render children normally
  return <>{children}</>;
};

// Helper functions for error display
function getErrorIcon(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK:
      return '🌐';
    case ErrorType.API:
      return '🔌';
    case ErrorType.NAVIGATION:
      return '🧭';
    case ErrorType.AUTHENTICATION:
      return '🔐';
    case ErrorType.PROGRESS_UPDATE:
      return '💾';
    case ErrorType.VALIDATION:
      return '⚠️';
    default:
      return '❌';
  }
}

function getErrorTitle(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Connection Problem';
    case ErrorType.API:
      return 'Server Error';
    case ErrorType.NAVIGATION:
      return 'Navigation Error';
    case ErrorType.AUTHENTICATION:
      return 'Authentication Required';
    case ErrorType.PROGRESS_UPDATE:
      return 'Progress Save Error';
    case ErrorType.VALIDATION:
      return 'Validation Error';
    default:
      return 'Something went wrong';
  }
}

function getErrorMessage(error: any): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return "We can't reach our servers right now. Please check your internet connection and try again.";
    case ErrorType.API:
      return "Our servers are having trouble. We're working to fix this!";
    case ErrorType.NAVIGATION:
      return "We couldn't navigate to that page. Let's get you back on track!";
    case ErrorType.AUTHENTICATION:
      return "Please log in again to continue your learning journey.";
    case ErrorType.PROGRESS_UPDATE:
      return "We couldn't save your progress right now. Don't worry, we'll try again automatically!";
    case ErrorType.VALIDATION:
      return "There's an issue with the data. Please check and try again.";
    default:
      return error.message || "Don't worry, we'll get this sorted out!";
  }
}

export default ErrorHandler;