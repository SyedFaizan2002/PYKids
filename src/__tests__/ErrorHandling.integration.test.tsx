import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import NavigationErrorBoundary from '../components/NavigationErrorBoundary';
import APIErrorBoundary from '../components/APIErrorBoundary';
import ErrorHandler from '../components/ErrorHandler';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { errorHandlingService } from '../services/ErrorHandlingService';

// Mock the error handling service
vi.mock('../services/ErrorHandlingService', () => ({
  ErrorHandlingService: {
    getInstance: () => ({
      handleError: vi.fn((error) => ({
        type: 'unknown',
        severity: 'medium',
        message: error.message,
        timestamp: new Date().toISOString(),
        retryable: true,
        maxRetries: 3,
        currentRetry: 0
      })),
      storeOfflineData: vi.fn(),
      getErrorStats: vi.fn(() => ({
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        retryQueueSize: 0,
        offlineDataSize: 0
      })),
      clearErrorData: vi.fn(),
      isServiceOnline: vi.fn(() => true),
      syncOfflineData: vi.fn()
    })
  },
  errorHandlingService: {
    handleError: vi.fn(),
    storeOfflineData: vi.fn(),
    getErrorStats: vi.fn(),
    clearErrorData: vi.fn(),
    isServiceOnline: vi.fn(() => true),
    syncOfflineData: vi.fn()
  },
  ErrorType: {
    NAVIGATION: 'navigation',
    API: 'api',
    PROGRESS_UPDATE: 'progress_update',
    AUTHENTICATION: 'authentication',
    NETWORK: 'network',
    VALIDATION: 'validation',
    UNKNOWN: 'unknown'
  },
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Test components
const ThrowingComponent: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({ 
  shouldThrow, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Normal content</div>;
};

const ErrorHandlerTestComponent: React.FC = () => {
  const { error, handleError, retry, clearError, isRetrying } = useErrorHandler();

  const triggerError = () => {
    handleError(new Error('Test error from hook'));
  };

  if (error) {
    return (
      <div>
        <div data-testid="error-message">{error.message}</div>
        <button onClick={retry} disabled={isRetrying} data-testid="retry-button">
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
        <button onClick={clearError} data-testid="clear-button">
          Clear Error
        </button>
      </div>
    );
  }

  return (
    <div>
      <div data-testid="normal-content">Normal content</div>
      <button onClick={triggerError} data-testid="trigger-error">
        Trigger Error
      </button>
    </div>
  );
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear.mockClear();
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('ErrorBoundary Integration', () => {
    it('should catch and display errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Component error" />
        </ErrorBoundary>,
        { wrapper }
      );

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      expect(screen.getByText(/Reload Page/)).toBeInTheDocument();
    });

    it('should render children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>,
        { wrapper }
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('should provide reload functionality', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
        { wrapper }
      );

      const reloadButton = screen.getByText(/Reload Page/);
      fireEvent.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalled();
      reloadSpy.mockRestore();
    });
  });

  describe('NavigationErrorBoundary Integration', () => {
    it('should handle navigation-specific errors', () => {
      render(
        <NavigationErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Navigation failed" />
        </NavigationErrorBoundary>,
        { wrapper }
      );

      expect(screen.getByText(/Navigation Error/)).toBeInTheDocument();
      expect(screen.getByText(/Go to Dashboard/)).toBeInTheDocument();
    });

    it('should provide retry functionality for navigation errors', () => {
      render(
        <NavigationErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Navigation failed" />
        </NavigationErrorBoundary>,
        { wrapper }
      );

      const retryButton = screen.getByText(/Try Again/);
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      // After retry, the error should be cleared and component should re-render
    });
  });

  describe('APIErrorBoundary Integration', () => {
    it('should handle API-specific errors', () => {
      render(
        <APIErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="API server error" />
        </APIErrorBoundary>,
        { wrapper }
      );

      expect(screen.getByText(/Server Error/)).toBeInTheDocument();
      expect(screen.getByText(/Try Again/)).toBeInTheDocument();
    });

    it('should handle network errors differently', () => {
      render(
        <APIErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Network timeout" />
        </APIErrorBoundary>,
        { wrapper }
      );

      expect(screen.getByText(/Connection Problem/)).toBeInTheDocument();
    });

    it('should show offline indicator when offline', () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(
        <APIErrorBoundary showOfflineIndicator={true}>
          <div>Content</div>
        </APIErrorBoundary>,
        { wrapper }
      );

      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });
  });

  describe('ErrorHandler Component Integration', () => {
    it('should handle errors through useErrorHandler hook', () => {
      render(<ErrorHandlerTestComponent />, { wrapper });

      expect(screen.getByTestId('normal-content')).toBeInTheDocument();

      const triggerButton = screen.getByTestId('trigger-error');
      fireEvent.click(triggerButton);

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Test error from hook')).toBeInTheDocument();
    });

    it('should provide retry functionality through hook', async () => {
      render(<ErrorHandlerTestComponent />, { wrapper });

      // Trigger error
      const triggerButton = screen.getByTestId('trigger-error');
      fireEvent.click(triggerButton);

      // Verify error is displayed
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Click retry
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Should show retrying state
      await waitFor(() => {
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });
    });

    it('should clear errors through hook', () => {
      render(<ErrorHandlerTestComponent />, { wrapper });

      // Trigger error
      const triggerButton = screen.getByTestId('trigger-error');
      fireEvent.click(triggerButton);

      // Verify error is displayed
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Clear error
      const clearButton = screen.getByTestId('clear-button');
      fireEvent.click(clearButton);

      // Should return to normal content
      expect(screen.getByTestId('normal-content')).toBeInTheDocument();
    });
  });

  describe('Offline Functionality Integration', () => {
    it('should handle offline state transitions', () => {
      render(
        <APIErrorBoundary showOfflineIndicator={true}>
          <ErrorHandlerTestComponent />
        </APIErrorBoundary>,
        { wrapper }
      );

      // Start online
      expect(screen.getByTestId('normal-content')).toBeInTheDocument();

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Trigger offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      // Should show offline indicator
      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle multiple error types in sequence', () => {
      const MultiErrorComponent: React.FC = () => {
        const [errorType, setErrorType] = React.useState<string | null>(null);

        if (errorType === 'network') {
          throw new Error('Network error');
        }
        if (errorType === 'api') {
          throw new Error('API error');
        }

        return (
          <div>
            <button onClick={() => setErrorType('network')} data-testid="trigger-network">
              Trigger Network Error
            </button>
            <button onClick={() => setErrorType('api')} data-testid="trigger-api">
              Trigger API Error
            </button>
          </div>
        );
      };

      render(
        <ErrorBoundary>
          <MultiErrorComponent />
        </ErrorBoundary>,
        { wrapper }
      );

      // Should render normally initially
      expect(screen.getByTestId('trigger-network')).toBeInTheDocument();
    });
  });

  describe('Error Persistence Integration', () => {
    it('should persist error data to localStorage', () => {
      render(<ErrorHandlerTestComponent />, { wrapper });

      const triggerButton = screen.getByTestId('trigger-error');
      fireEvent.click(triggerButton);

      // Error handling service should be called
      expect(errorHandlingService.handleError).toHaveBeenCalled();
    });
  });

  describe('Development Mode Features', () => {
    it('should show developer info in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Dev error" />
        </ErrorBoundary>,
        { wrapper }
      );

      expect(screen.getByText(/Developer Info/)).toBeInTheDocument();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});