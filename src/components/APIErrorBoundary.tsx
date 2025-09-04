import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandlingService, ErrorType, ErrorSeverity } from '../services/ErrorHandlingService';

interface Props {
  children: ReactNode;
  onAPIError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetryButton?: boolean;
  showOfflineIndicator?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isRetrying: boolean;
  isOffline: boolean;
}

class APIErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    isRetrying: false,
    isOffline: !navigator.onLine
  };

  public componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleOnline = () => {
    this.setState({ isOffline: false });
    
    // Auto-retry if there was an error and we're back online
    if (this.state.hasError && !this.state.isRetrying) {
      this.handleRetry();
    }
  };

  private handleOffline = () => {
    this.setState({ isOffline: true });
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('APIErrorBoundary caught an error:', error, errorInfo);
    
    // Determine if this is an API-related error
    const isAPIError = this.isAPIRelatedError(error);
    const isNetworkError = this.isNetworkError(error);
    
    // Handle error with error handling service
    const errorDetails = errorHandlingService.handleError(error, {
      component: 'APIErrorBoundary',
      errorInfo,
      isAPIError,
      isNetworkError,
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.setState({ errorInfo });

    // Store offline data if it's a network error
    if (isNetworkError && errorDetails.context?.apiData) {
      errorHandlingService.storeOfflineData('action', {
        action: 'api_call_failed',
        data: errorDetails.context.apiData
      });
    }

    // Call the optional onError callback
    if (this.props.onAPIError) {
      this.props.onAPIError(error, errorInfo);
    }
  }

  private isAPIRelatedError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('api') || 
           message.includes('fetch') || 
           message.includes('network') ||
           message.includes('server') ||
           message.includes('http') ||
           message.includes('response');
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('timeout') ||
           message.includes('connection') ||
           error.name === 'NetworkError';
  }

  private handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Wait a bit before retrying
      await new Promise(resolve => {
        this.retryTimeoutId = setTimeout(resolve, 1000);
      });

      // Reset error state to retry rendering
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        isRetrying: false
      });

      console.log('🔄 API Error Boundary: Retrying...');
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ isRetrying: false });
    }
  };

  private handleClearCache = () => {
    // Clear API cache and local storage
    localStorage.removeItem('userCache');
    sessionStorage.clear();
    
    // Clear error handling service data
    errorHandlingService.clearErrorData();
    
    // Reload the page
    window.location.reload();
  };

  private handleGoOffline = () => {
    // Switch to offline mode manually
    this.setState({ isOffline: true });
    
    // Reset error state to show offline UI
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  public render() {
    // Show offline indicator if requested and offline
    if (this.props.showOfflineIndicator && this.state.isOffline && !this.state.hasError) {
      return (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50">
            📴 You're offline. Some features may not work properly.
          </div>
          <div className="pt-10">
            {this.props.children}
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      const isAPIError = this.isAPIRelatedError(this.state.error!);
      const isNetworkError = this.isNetworkError(this.state.error!);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md mx-4">
            <div className="text-6xl mb-4">
              {isNetworkError ? '🌐' : isAPIError ? '🔌' : '⚠️'}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              {isNetworkError ? 'Connection Problem' : 
               isAPIError ? 'Server Error' : 'Something went wrong'}
            </h2>
            
            <p className="text-purple-200 mb-6">
              {isNetworkError ? 
                "We can't reach our servers right now. Check your internet connection!" :
                isAPIError ?
                "Our servers are having trouble. We're working to fix this!" :
                "Don't worry, we'll get this sorted out! 🛠️"
              }
            </p>

            {this.state.isOffline && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  📴 You're currently offline. Your progress will be saved locally and synced when you're back online.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {this.props.showRetryButton !== false && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {this.state.isRetrying ? '🔄 Retrying...' : '🔄 Try Again'}
                </button>
              )}
              
              {isNetworkError && !this.state.isOffline && (
                <button
                  onClick={this.handleGoOffline}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  📴 Continue Offline
                </button>
              )}
              
              <button
                onClick={this.handleClearCache}
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                🧹 Clear Cache & Reload
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                🏠 Go to Dashboard
              </button>
            </div>

            {/* Error stats for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4">
                <details className="text-left">
                  <summary className="text-red-300 cursor-pointer text-sm">
                    🐛 Developer Info (click to expand)
                  </summary>
                  <div className="mt-2 p-3 bg-red-900/20 rounded text-red-200 text-xs">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error?.toString()}
                    </div>
                    <div className="mb-2">
                      <strong>Type:</strong> {isNetworkError ? 'Network' : isAPIError ? 'API' : 'Unknown'}
                    </div>
                    <div className="mb-2">
                      <strong>Online:</strong> {this.state.isOffline ? 'No' : 'Yes'}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default APIErrorBoundary;