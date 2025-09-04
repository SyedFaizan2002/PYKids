import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '../ErrorHandlingService';

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

// Mock window.addEventListener
const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

describe('ErrorHandlingService', () => {
  let errorService: ErrorHandlingService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset singleton instance
    (ErrorHandlingService as any).instance = undefined;
    errorService = ErrorHandlingService.getInstance();
  });

  afterEach(() => {
    errorService.clearErrorData();
  });

  describe('Error Categorization', () => {
    it('should categorize network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const errorDetails = errorService.handleError(networkError);

      expect(errorDetails.type).toBe(ErrorType.NETWORK);
      expect(errorDetails.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorDetails.retryable).toBe(true);
    });

    it('should categorize API errors correctly', () => {
      const apiError = new Error('API server error');
      const errorDetails = errorService.handleError(apiError);

      expect(errorDetails.type).toBe(ErrorType.API);
      expect(errorDetails.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorDetails.retryable).toBe(true);
    });

    it('should categorize navigation errors correctly', () => {
      const navError = new Error('Navigation route not found');
      const errorDetails = errorService.handleError(navError);

      expect(errorDetails.type).toBe(ErrorType.NAVIGATION);
      expect(errorDetails.severity).toBe(ErrorSeverity.LOW);
      expect(errorDetails.retryable).toBe(false);
    });

    it('should categorize authentication errors correctly', () => {
      const authError = new Error('Unauthorized access');
      const errorDetails = errorService.handleError(authError);

      expect(errorDetails.type).toBe(ErrorType.AUTHENTICATION);
      expect(errorDetails.severity).toBe(ErrorSeverity.CRITICAL);
      expect(errorDetails.retryable).toBe(false);
    });

    it('should categorize progress update errors correctly', () => {
      const progressError = new Error('Progress update failed');
      const errorDetails = errorService.handleError(progressError);

      expect(errorDetails.type).toBe(ErrorType.PROGRESS_UPDATE);
      expect(errorDetails.severity).toBe(ErrorSeverity.HIGH);
      expect(errorDetails.retryable).toBe(true);
    });
  });

  describe('Offline Data Storage', () => {
    it('should store progress data offline', () => {
      const progressData = {
        moduleId: 'module1',
        topicId: 'topic1',
        completed: true,
        score: 10
      };

      errorService.storeOfflineData('progress', progressData, 'user123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pykids_offline_data',
        expect.stringContaining('user123')
      );
    });

    it('should store navigation data offline', () => {
      const navData = {
        moduleId: 'module1',
        topicId: 'topic1',
        timestamp: new Date().toISOString(),
        completionStatus: 'started'
      };

      errorService.storeOfflineData('navigation', navData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pykids_offline_data',
        expect.stringContaining('module1')
      );
    });

    it('should store action data offline', () => {
      const actionData = {
        action: 'lesson_completed',
        data: { lessonId: 'lesson1' }
      };

      errorService.storeOfflineData('action', actionData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pykids_offline_data',
        expect.stringContaining('lesson_completed')
      );
    });
  });

  describe('Online/Offline Status', () => {
    it('should detect online status correctly', () => {
      expect(errorService.isServiceOnline()).toBe(true);
    });

    it('should setup online/offline event listeners', () => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics correctly', () => {
      // Add some test errors
      errorService.handleError(new Error('Network error'));
      errorService.handleError(new Error('API error'));
      errorService.handleError(new Error('Navigation error'));

      const stats = errorService.getErrorStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ErrorType.NETWORK]).toBe(1);
      expect(stats.errorsByType[ErrorType.API]).toBe(1);
      expect(stats.errorsByType[ErrorType.NAVIGATION]).toBe(1);
    });

    it('should track error severity correctly', () => {
      errorService.handleError(new Error('Unauthorized'));
      errorService.handleError(new Error('Network timeout'));

      const stats = errorService.getErrorStats();

      expect(stats.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
    });
  });

  describe('Data Persistence', () => {
    it('should persist error data to localStorage', () => {
      errorService.handleError(new Error('Test error'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pykids_error_log',
        expect.any(String)
      );
    });

    it('should load persisted error data on initialization', () => {
      const mockErrorLog = JSON.stringify([
        {
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          message: 'Test error',
          timestamp: new Date().toISOString(),
          retryable: true
        }
      ]);

      localStorageMock.getItem.mockReturnValue(mockErrorLog);

      // Create new instance to test loading
      (ErrorHandlingService as any).instance = undefined;
      const newService = ErrorHandlingService.getInstance();
      const stats = newService.getErrorStats();

      expect(stats.totalErrors).toBe(1);
    });
  });

  describe('Error Clearing', () => {
    it('should clear all error data', () => {
      errorService.handleError(new Error('Test error'));
      errorService.storeOfflineData('progress', { test: 'data' });

      errorService.clearErrorData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pykids_error_log');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pykids_retry_queue');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pykids_offline_data');

      const stats = errorService.getErrorStats();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    it('should mark retryable errors for retry', () => {
      const networkError = new Error('Network timeout');
      const errorDetails = errorService.handleError(networkError);

      expect(errorDetails.retryable).toBe(true);
      expect(errorDetails.maxRetries).toBeGreaterThan(0);
    });

    it('should not mark non-retryable errors for retry', () => {
      const navError = new Error('Navigation failed');
      const errorDetails = errorService.handleError(navError);

      expect(errorDetails.retryable).toBe(false);
    });
  });

  describe('Context Handling', () => {
    it('should include context in error details', () => {
      const context = { userId: 'user123', operation: 'fetchProfile' };
      const error = new Error('Test error');
      
      const errorDetails = errorService.handleError(error, context);

      expect(errorDetails.context).toEqual(context);
    });

    it('should handle errors without context', () => {
      const error = new Error('Test error');
      
      const errorDetails = errorService.handleError(error);

      expect(errorDetails.context).toBeUndefined();
    });
  });
});