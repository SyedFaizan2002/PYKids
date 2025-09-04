import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorHandlingService, ErrorType, ErrorSeverity } from '../services/ErrorHandlingService';

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
  onNavigationError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

class NavigationErrorBoundaryClass extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NavigationErrorBoundary caught an error:', error, errorInfo);
    
    // Handle error with error handling service
    errorHandlingService.handleError(error, {
      component: 'NavigationErrorBoundary',
      errorInfo,
      route: window.location.pathname
    });

    this.setState({ errorInfo });

    // Call the optional onError callback
    if (this.props.onNavigationError) {
      this.props.onNavigationError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleNavigateHome = () => {
    const fallbackRoute = this.props.fallbackRoute || '/dashboard';
    window.location.href = fallbackRoute;
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < this.maxRetries;
      const isNavigationError = this.state.error?.message.toLowerCase().includes('navigation') ||
                               this.state.error?.message.toLowerCase().includes('route');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md mx-4">
            <div className="text-6xl mb-4">🧭</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isNavigationError ? 'Navigation Error' : 'Something went wrong'}
            </h2>
            <p className="text-purple-200 mb-6">
              {isNavigationError 
                ? "We couldn't navigate to that page. Let's get you back on track!"
                : "Don't worry, we'll help you get back to learning! 🚀"
              }
            </p>
            
            {this.state.retryCount > 0 && (
              <p className="text-yellow-300 text-sm mb-4">
                Retry attempt {this.state.retryCount} of {this.maxRetries}
              </p>
            )}

            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  🔄 Try Again
                </button>
              )}
              
              <button
                onClick={this.handleNavigateHome}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                🏠 Go to Dashboard
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                🔄 Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-red-300 cursor-pointer text-sm">
                  🐛 Developer Info (click to expand)
                </summary>
                <div className="mt-2 p-3 bg-red-900/20 rounded text-red-200 text-xs">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
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
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper to use React Router hooks
export const NavigationErrorBoundary: React.FC<Props> = ({ children, ...props }) => {
  return (
    <NavigationErrorBoundaryClass {...props}>
      {children}
    </NavigationErrorBoundaryClass>
  );
};

export default NavigationErrorBoundary;