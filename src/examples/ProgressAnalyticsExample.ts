import { progressAnalyticsService } from '../services/ProgressAnalytics';
import { UserData } from '../contexts/UserContext';
import {
  formatCompletionPercentage,
  formatLessonCount,
  getProgressStatusMessage,
  getProgressEmoji,
  getNextMilestone
} from '../utils/progressUtils';

/**
 * Example usage of the ProgressAnalytics service and utilities
 */

// Example user data
const exampleUserData: UserData = {
  id: 'example-user',
  email: 'student@example.com',
  progress: {
    module1: {
      topic1: { completed: true, score: 10, completedAt: '2024-01-01T10:00:00Z' },
      topic2: { completed: true, score: 8, completedAt: '2024-01-02T10:00:00Z' },
      topic3: { completed: false, score: 5 },
      topic4: { completed: false },
      topic5: { completed: false }
    },
    module2: {
      topic6: { completed: true, score: 9, completedAt: '2024-01-03T10:00:00Z' },
      topic7: { completed: false },
      topic8: { completed: false },
      topic9: { completed: false },
      topic10: { completed: false }
    }
  },
  totalScore: 27,
  lastActiveLesson: {
    moduleId: 'module1',
    topicId: 'topic3'
  }
};

/**
 * Example: Calculate comprehensive progress analytics
 */
export function demonstrateProgressAnalytics() {
  console.log('=== Progress Analytics Demo ===\n');

  // Get comprehensive analytics
  const analytics = progressAnalyticsService.calculateProgressAnalytics(exampleUserData);
  
  console.log('📊 Overall Progress:');
  console.log(`Total Lessons: ${analytics.totalLessons}`);
  console.log(`Completed Lessons: ${analytics.completedLessons}`);
  console.log(`Completion Percentage: ${formatCompletionPercentage(analytics.completionPercentage)}`);
  console.log(`Progress Display: ${formatLessonCount(analytics.completedLessons, analytics.totalLessons)}`);
  console.log(`Status Message: ${getProgressStatusMessage(analytics.completedLessons, analytics.totalLessons)}`);
  console.log(`Progress Emoji: ${getProgressEmoji(analytics.completionPercentage)}\n`);

  // Show last active lesson
  if (analytics.lastActiveLesson) {
    console.log('📍 Last Active Lesson:');
    console.log(`Module: ${analytics.lastActiveLesson.moduleName}`);
    console.log(`Lesson: ${analytics.lastActiveLesson.title}\n`);
  }

  // Show module progress
  console.log('📚 Module Progress:');
  analytics.moduleProgress.forEach(module => {
    console.log(`${module.moduleName}:`);
    console.log(`  - ${formatLessonCount(module.completedLessons, module.totalLessons)}`);
    console.log(`  - ${formatCompletionPercentage(module.percentage)} complete`);
  });
  console.log();

  // Show next milestone
  const milestone = getNextMilestone(analytics.completedLessons, analytics.totalLessons);
  console.log('🎯 Next Milestone:');
  console.log(`Target: ${milestone.nextMilestone} lessons`);
  console.log(`Lessons to go: ${milestone.lessonsToMilestone}`);
  console.log(`Message: ${milestone.milestoneMessage}\n`);
}

/**
 * Example: Get next recommended lesson
 */
export function demonstrateRecommendations() {
  console.log('=== Lesson Recommendations Demo ===\n');

  // Check if user has resumable lesson
  const hasResumable = progressAnalyticsService.hasResumableLesson(exampleUserData);
  console.log(`Has resumable lesson: ${hasResumable}`);

  // Get next recommended lesson
  const recommendation = progressAnalyticsService.getNextRecommendedLesson(exampleUserData);
  if (recommendation) {
    console.log(`Recommended lesson: ${recommendation.moduleId}/${recommendation.topicId}`);
  }

  // Get progress summary
  const summary = progressAnalyticsService.getProgressSummary(exampleUserData);
  console.log('\n📈 Progress Summary:');
  console.log(`Total Lessons: ${summary.totalLessons}`);
  console.log(`Completed: ${summary.completedLessons}`);
  console.log(`In Progress: ${summary.inProgressLessons}`);
  console.log(`Average Score: ${summary.averageScore}`);
  console.log(`Last Active: ${summary.lastActiveDate}\n`);
}

/**
 * Example: Module-specific analytics
 */
export function demonstrateModuleAnalytics() {
  console.log('=== Module Analytics Demo ===\n');

  // Check module completion status
  const module1Status = progressAnalyticsService.getModuleCompletionStatus(
    exampleUserData.progress, 
    'module1'
  );
  
  console.log('Module 1 Status:');
  console.log(`Completed: ${module1Status.isCompleted}`);
  console.log(`Progress: ${formatLessonCount(module1Status.completedLessons, module1Status.totalLessons)}`);
  console.log(`Percentage: ${formatCompletionPercentage(module1Status.percentage)}\n`);

  // Validate progress data
  const validation = progressAnalyticsService.validateProgressData(exampleUserData.progress);
  console.log('Data Validation:');
  console.log(`Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log('Errors:', validation.errors);
  }
  console.log();
}

/**
 * Example: Individual lesson checks
 */
export function demonstrateLessonChecks() {
  console.log('=== Lesson Status Demo ===\n');

  // Check specific lesson completion
  const isCompleted = progressAnalyticsService.isLessonCompleted(
    exampleUserData.progress,
    'module1',
    'topic1'
  );
  console.log(`Module 1, Topic 1 completed: ${isCompleted}`);

  // Calculate average score
  const averageScore = progressAnalyticsService.calculateAverageScore(exampleUserData.progress);
  console.log(`Average score: ${averageScore}`);

  // Count completed lessons
  const completedCount = progressAnalyticsService.getCompletedLessonsCount(exampleUserData.progress);
  console.log(`Total completed lessons: ${completedCount}\n`);
}

/**
 * Run all examples
 */
export function runAllExamples() {
  demonstrateProgressAnalytics();
  demonstrateRecommendations();
  demonstrateModuleAnalytics();
  demonstrateLessonChecks();
}

// Uncomment to run examples
// runAllExamples();