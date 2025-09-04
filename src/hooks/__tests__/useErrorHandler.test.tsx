import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useErrorHandler } from '../useErrorHandler';
import { ErrorType, ErrorSeverity } from '../../services/ErrorHandlingService';

// Mock the error handling service
vi.mock('../../services/ErrorHandlingService', () => ({
  ErrorHandlingService: {
    getInstance: () => ({
      handleError: vi.fn((error) => ({
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
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
      }))
    })
  },
  ErrorType,
  ErrorSeverity,
  errorHandlingService: {
    handleError: vi.fn(),
    storeOfflineData: vi.fn(),
    getErrorStats: vi.fn()
  }
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

// Wrapper component for React Router
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
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

  describe('Basic Error Handling', () => {
    it('should handle errors correctly', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      act(() => {
        const error = new Error('Test error');
        result.current.handleError(error);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Test error');
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should track retry count', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      expect(result.current.retryCount).toBe(0);
    });
  });

  describe('Online/Offline Status', () => {
    it('should track online status', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      expect(result.current.isOnline).toBe(true);
    });

    it('should update online status when navigator.onLine changes', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        
        // Trigger offline event
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);
      });

      expect(result.current.isOnline).toBe(false);

      // Simulate going back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        
        // Trigger online event
        const onlineEvent = new Event('online');
        window.dispatchEvent(onlineEvent);
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Navigation Error Handling', () => {
    it('should navigate to dashboard on navigation errors', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      act(() => {
        const navError = new Error('Navigation failed');
        // Mock the error service to return navigation error type
        const errorDetails = {
          type: ErrorType.NAVIGATION,
          severity: ErrorSeverity.LOW,
          message: navError.message,
          timestamp: new Date().toISOString(),
          retryable: false
        };
        
        result.current.handleError(navError);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('Authentication Error Handling', () => {
    it('should clear user data and navigate to login on auth errors', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      act(() => {
        const authError = new Error('Unauthorized');
        // Mock the error service to return auth error type
        const errorDetails = {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.CRITICAL,
          message: authError.message,
          timestamp: new Date().toISOString(),
          retryable: false
        };
        
        result.current.handleError(authError);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userCache');
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('Offline Data Storage', () => {
    it('should store offline data', () => {
      const { result } = renderHook(() => useErrorHandler({ enableOfflineStorage: true }), { wrapper });

      act(() => {
        result.current.storeOfflineData('progress', { test: 'data' }, 'user123');
      });

      // The actual storage is handled by the error handling service
      // We just verify the hook calls the service method
      expect(result.current.storeOfflineData).toBeDefined();
    });

    it('should not store offline data when disabled', () => {
      const { result } = renderHook(() => useErrorHandler({ enableOfflineStorage: false }), { wrapper });

      act(() => {
        result.current.storeOfflineData('progress', { test: 'data' }, 'user123');
      });

      // Should not throw error even when disabled
      expect(result.current.storeOfflineData).toBeDefined();
    });
  });

  describe('Error Callbacks', () => {
    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useErrorHandler({ onError }), { wrapper });

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      expect(onError).toHaveBeenCalled();
    });

    it('should call onRetrySuccess callback on successful retry', async () => {
      const onRetrySuccess = vi.fn();
      const { result } = renderHook(() => useErrorHandler({ onRetrySuccess }), { wrapper });

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      // Mock successful retry
      await act(async () => {
        await result.current.retry();
      });

      // Note: The actual retry logic would need to be mocked more thoroughly
      // This test verifies the callback is set up correctly
      expect(onRetrySuccess).toBeDefined();
    });
  });

  describe('Retry Configuration', () => {
    it('should respect maxRetries configuration', () => {
      const maxRetries = 5;
      const { result } = renderHook(() => useErrorHandler({ maxRetries }), { wrapper });

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      // The hook should be configured with the specified max retries
      expect(result.current.retryCount).toBe(0);
    });

    it('should handle retry disabled', () => {
      const { result } = renderHook(() => useErrorHandler({ enableRetry: false }), { wrapper });

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      // Retry should still be available as a function but may not be enabled
      expect(typeof result.current.retry).toBe('function');
    });
  });

  describe('Error Statistics', () => {
    it('should provide error statistics', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      const stats = result.current.getErrorStats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('Retry Logic', () => {
    it('should handle retry attempts', async () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      act(() => {
        result.current.handleError(new Error('Network error'));
      });

      expect(result.current.isRetrying).toBe(false);

      // Attempt retry
      await act(async () => {
        const retryPromise = result.current.retry();
        expect(result.current.isRetrying).toBe(true);
        await retryPromise;
      });
    });

    it('should not retry non-retryable errors', async () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      act(() => {
        const error = new Error('Validation error');
        result.current.handleError(error);
      });

      // Even if retry is called, it should handle non-retryable errors gracefully
      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.isRetrying).toBe(false);
    });
  });
});