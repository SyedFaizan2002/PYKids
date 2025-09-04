import { NavigationHistoryEntry } from '../contexts/UserContext';
import { LessonProgress } from './api';

// Error types for better categorization
export enum ErrorType {
  NAVIGATION = 'navigation',
  API = 'api',
  PROGRESS_UPDATE = 'progress_update',
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: any;
  timestamp: string;
  userId?: string;
  retryable: boolean;
  maxRetries?: number;
  currentRetry?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export interface OfflineData {
  progressUpdates: Array<{
    userId: string;
    progress: LessonProgress;
    timestamp: string;
    id: string;
  }>;
  navigationHistory: NavigationHistoryEntry[];
  userActions: Array<{
    action: string;
    data: any;
    timestamp: string;
    id: string;
  }>;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.API, ErrorType.PROGRESS_UPDATE, ErrorType.NETWORK]
};

// Local storage keys
const STORAGE_KEYS = {
  OFFLINE_DATA: 'pykids_offline_data',
  ERROR_LOG: 'pykids_error_log',
  RETRY_QUEUE: 'pykids_retry_queue'
} as const;

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private retryConfig: RetryConfig;
  private errorLog: ErrorDetails[] = [];
  private retryQueue: Map<string, ErrorDetails> = new Map();
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  private constructor(config?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.setupOnlineStatusListeners();
    this.loadPersistedData();
  }

  public static getInstance(config?: Partial<RetryConfig>): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService(config);
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Setup online/offline status listeners
   */
  private setupOnlineStatusListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });
  }

  /**
   * Handle online status changes
   */
  private async handleOnlineStatusChange(isOnline: boolean): Promise<void> {
    if (isOnline && !this.syncInProgress) {
      console.log('🌐 Connection restored, syncing offline data...');
      await this.syncOfflineData();
    } else if (!isOnline) {
      console.log('📴 Connection lost, switching to offline mode...');
    }
  }

  /**
   * Load persisted error data from localStorage
   */
  private loadPersistedData(): void {
    try {
      // Load error log
      const errorLogData = localStorage.getItem(STORAGE_KEYS.ERROR_LOG);
      if (errorLogData) {
        this.errorLog = JSON.parse(errorLogData);
      }

      // Load retry queue
      const retryQueueData = localStorage.getItem(STORAGE_KEYS.RETRY_QUEUE);
      if (retryQueueData) {
        const queueArray = JSON.parse(retryQueueData);
        this.retryQueue = new Map(queueArray);
      }
    } catch (error) {
      console.error('Error loading persisted error data:', error);
    }
  }

  /**
   * Persist error data to localStorage
   */
  private persistErrorData(): void {
    try {
      // Persist error log (keep only last 100 entries)
      const recentErrors = this.errorLog.slice(-100);
      localStorage.setItem(STORAGE_KEYS.ERROR_LOG, JSON.stringify(recentErrors));

      // Persist retry queue
      const queueArray = Array.from(this.retryQueue.entries());
      localStorage.setItem(STORAGE_KEYS.RETRY_QUEUE, JSON.stringify(queueArray));
    } catch (error) {
      console.error('Error persisting error data:', error);
    }
  }

  /**
   * Handle and categorize errors
   */
  public handleError(error: Error | ErrorDetails, context?: any): ErrorDetails {
    let errorDetails: ErrorDetails;

    if ('type' in error) {
      // Already an ErrorDetails object
      errorDetails = error;
    } else {
      // Convert Error to ErrorDetails
      errorDetails = this.categorizeError(error, context);
    }

    // Add to error log
    this.errorLog.push(errorDetails);
    this.persistErrorData();

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error handled:', errorDetails);
    }

    // Handle based on error type and severity
    this.processError(errorDetails);

    return errorDetails;
  }

  /**
   * Categorize errors based on type and context
   */
  private categorizeError(error: Error, context?: any): ErrorDetails {
    const timestamp = new Date().toISOString();
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let retryable = false;

    // Categorize based on error message and context
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      retryable = true;
    } else if (message.includes('navigation') || message.includes('route')) {
      type = ErrorType.NAVIGATION;
      severity = ErrorSeverity.LOW;
      retryable = false;
    } else if (message.includes('progress') || message.includes('update')) {
      type = ErrorType.PROGRESS_UPDATE;
      severity = ErrorSeverity.HIGH;
      retryable = true;
    } else if (message.includes('auth') || message.includes('unauthorized')) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.CRITICAL;
      retryable = false;
    } else if (message.includes('api') || message.includes('server')) {
      type = ErrorType.API;
      severity = ErrorSeverity.MEDIUM;
      retryable = true;
    } else if (message.includes('validation') || message.includes('invalid')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      retryable = false;
    }

    return {
      type,
      severity,
      message: error.message,
      originalError: error,
      context,
      timestamp,
      retryable,
      maxRetries: retryable ? this.retryConfig.maxRetries : 0,
      currentRetry: 0
    };
  }

  /**
   * Process error based on type and severity
   */
  private processError(errorDetails: ErrorDetails): void {
    // Add to retry queue if retryable
    if (errorDetails.retryable && this.retryConfig.retryableErrors.includes(errorDetails.type)) {
      const retryId = `${errorDetails.type}_${Date.now()}_${Math.random()}`;
      this.retryQueue.set(retryId, errorDetails);
      this.scheduleRetry(retryId, errorDetails);
    }

    // Handle critical errors immediately
    if (errorDetails.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(errorDetails);
    }
  }

  /**
   * Schedule retry for failed operations
   */
  private scheduleRetry(retryId: string, errorDetails: ErrorDetails): void {
    const currentRetry = errorDetails.currentRetry || 0;
    
    if (currentRetry >= (errorDetails.maxRetries || this.retryConfig.maxRetries)) {
      console.error('🔄 Max retries exceeded for error:', errorDetails);
      this.retryQueue.delete(retryId);
      this.persistErrorData();
      return;
    }

    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, currentRetry),
      this.retryConfig.maxDelay
    );

    setTimeout(async () => {
      if (!this.isOnline && errorDetails.type === ErrorType.NETWORK) {
        // Reschedule if still offline
        this.scheduleRetry(retryId, errorDetails);
        return;
      }

      try {
        await this.executeRetry(errorDetails);
        this.retryQueue.delete(retryId);
        console.log('✅ Retry successful for:', errorDetails.type);
      } catch (retryError) {
        errorDetails.currentRetry = currentRetry + 1;
        this.scheduleRetry(retryId, errorDetails);
      }
      
      this.persistErrorData();
    }, delay);
  }

  /**
   * Execute retry based on error type
   */
  private async executeRetry(errorDetails: ErrorDetails): Promise<void> {
    switch (errorDetails.type) {
      case ErrorType.PROGRESS_UPDATE:
        await this.retryProgressUpdate(errorDetails);
        break;
      case ErrorType.API:
        await this.retryAPICall(errorDetails);
        break;
      case ErrorType.NETWORK:
        await this.retryNetworkOperation(errorDetails);
        break;
      default:
        throw new Error(`Retry not implemented for error type: ${errorDetails.type}`);
    }
  }

  /**
   * Retry progress update operations
   */
  private async retryProgressUpdate(errorDetails: ErrorDetails): Promise<void> {
    if (!errorDetails.context?.progressData) {
      throw new Error('No progress data available for retry');
    }

    const { userId, progress } = errorDetails.context.progressData;
    
    // Try to update progress again
    const { optimizedAPI } = await import('./OptimizedAPI');
    const result = await optimizedAPI.updateLessonProgress(userId, progress);
    
    if (!result.success) {
      throw new Error(result.error || 'Progress update retry failed');
    }
  }

  /**
   * Retry API call operations
   */
  private async retryAPICall(errorDetails: ErrorDetails): Promise<void> {
    if (!errorDetails.context?.apiCall) {
      throw new Error('No API call data available for retry');
    }

    const { url, options } = errorDetails.context.apiCall;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API retry failed: ${response.statusText}`);
    }
  }

  /**
   * Retry network operations
   */
  private async retryNetworkOperation(errorDetails: ErrorDetails): Promise<void> {
    // Generic network retry - ping a reliable endpoint
    const response = await fetch('/api/health', { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('Network connectivity check failed');
    }
  }

  /**
   * Handle critical errors that need immediate attention
   */
  private handleCriticalError(errorDetails: ErrorDetails): void {
    console.error('🚨 CRITICAL ERROR:', errorDetails);
    
    // For authentication errors, clear user data and redirect to login
    if (errorDetails.type === ErrorType.AUTHENTICATION) {
      localStorage.removeItem('userCache');
      sessionStorage.clear();
      // Trigger logout - this would be handled by the component using this service
    }
  }

  /**
   * Store data offline when operations fail
   */
  public storeOfflineData(type: 'progress' | 'navigation' | 'action', data: any, userId?: string): void {
    try {
      const offlineData = this.getOfflineData();
      const id = `${type}_${Date.now()}_${Math.random()}`;
      const timestamp = new Date().toISOString();

      switch (type) {
        case 'progress':
          offlineData.progressUpdates.push({
            userId: userId || '',
            progress: data,
            timestamp,
            id
          });
          break;
        case 'navigation':
          offlineData.navigationHistory.push(data);
          break;
        case 'action':
          offlineData.userActions.push({
            action: data.action,
            data: data.data,
            timestamp,
            id
          });
          break;
      }

      localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
      console.log(`📦 Stored ${type} data offline:`, data);
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  }

  /**
   * Get offline data from localStorage
   */
  private getOfflineData(): OfflineData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error parsing offline data:', error);
    }

    return {
      progressUpdates: [],
      navigationHistory: [],
      userActions: []
    };
  }

  /**
   * Sync offline data when connection is restored
   */
  public async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const offlineData = this.getOfflineData();
      const { optimizedAPI } = await import('./OptimizedAPI');

      // Sync progress updates
      for (const progressUpdate of offlineData.progressUpdates) {
        try {
          await optimizedAPI.updateLessonProgress(progressUpdate.userId, progressUpdate.progress);
          console.log('✅ Synced progress update:', progressUpdate.id);
        } catch (error) {
          console.error('❌ Failed to sync progress update:', progressUpdate.id, error);
          // Keep failed updates for next sync attempt
        }
      }

      // Clear successfully synced data
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_DATA);
      console.log('🔄 Offline data sync completed');

    } catch (error) {
      console.error('Error syncing offline data:', error);
      this.handleError(error as Error, { operation: 'syncOfflineData' });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    retryQueueSize: number;
    offlineDataSize: number;
  } {
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);

    // Count errors
    this.errorLog.forEach(error => {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
    });

    const offlineData = this.getOfflineData();

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      retryQueueSize: this.retryQueue.size,
      offlineDataSize: offlineData.progressUpdates.length + offlineData.userActions.length
    };
  }

  /**
   * Clear error log and retry queue (for testing/debugging)
   */
  public clearErrorData(): void {
    this.errorLog = [];
    this.retryQueue.clear();
    localStorage.removeItem(STORAGE_KEYS.ERROR_LOG);
    localStorage.removeItem(STORAGE_KEYS.RETRY_QUEUE);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_DATA);
  }

  /**
   * Check if the service is currently online
   */
  public isServiceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Force sync offline data (for manual triggers)
   */
  public async forceSyncOfflineData(): Promise<void> {
    await this.syncOfflineData();
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();