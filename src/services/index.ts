// Navigation Services
export { NavigationService, navigationService } from './NavigationService';
export type { 
  LessonNavigation, 
  NavigationState, 
  LessonSequence 
} from './NavigationService';

// Progress Analytics Services
export { ProgressAnalyticsService, progressAnalyticsService } from './ProgressAnalytics';
export type {
  ProgressAnalytics,
  ModuleProgress,
  DetailedProgress,
  ProgressSummary
} from './ProgressAnalytics';

// API Services
export { default as api } from './api';
export type {
  ApiResponse,
  UserProfile,
  LessonProgress,
  QuizResult
} from './api';