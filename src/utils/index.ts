// Navigation Utilities
export {
  calculateGlobalLessonIndex,
  getEnhancedNavigationState,
  generateLessonRoute,
  generateNextRoute,
  generatePreviousRoute,
  getLessonContext,
  getNavigationButtonStates,
  validateLessonParams,
  getBreadcrumbData,
  getModuleProgress,
  getCurriculumProgress
} from './navigationUtils';

// Progress Utilities
export {
  formatCompletionPercentage,
  formatLessonCount,
  getProgressStatusMessage,
  getProgressEmoji,
  calculateStreak,
  getNextMilestone,
  shouldShowEncouragement,
  getEncouragementMessage,
  isValidLessonPath,
  getTimeBasedGreeting,
  formatLastActiveLesson
} from './progressUtils';