import { UserData } from '../contexts/UserContext';
import { progressAnalyticsService } from '../services/ProgressAnalytics';

/**
 * Utility functions for progress calculations and formatting
 */

/**
 * Formats completion percentage for display
 */
export function formatCompletionPercentage(percentage: number): string {
  return `${percentage}%`;
}

/**
 * Formats lesson count for display (e.g., "3 of 10 lessons")
 */
export function formatLessonCount(completed: number, total: number): string {
  return `${completed} of ${total} lessons`;
}

/**
 * Gets a user-friendly progress status message
 */
export function getProgressStatusMessage(completedLessons: number, totalLessons: number): string {
  const percentage = Math.round((completedLessons / totalLessons) * 100);
  
  if (percentage === 0) {
    return "Ready to start your Python journey! 🚀";
  } else if (percentage < 25) {
    return "Great start! Keep going! 💪";
  } else if (percentage < 50) {
    return "You're making excellent progress! 🌟";
  } else if (percentage < 75) {
    return "More than halfway there! Amazing work! 🎯";
  } else if (percentage < 100) {
    return "Almost finished! You're doing fantastic! 🏆";
  } else {
    return "Congratulations! You've completed all lessons! 🎉";
  }
}

/**
 * Gets the appropriate emoji for completion percentage
 */
export function getProgressEmoji(percentage: number): string {
  if (percentage === 0) return "🌱";
  if (percentage < 25) return "🌿";
  if (percentage < 50) return "🌳";
  if (percentage < 75) return "🌟";
  if (percentage < 100) return "🏆";
  return "🎉";
}

/**
 * Calculates streak information (placeholder for future implementation)
 */
export function calculateStreak(userData: UserData): {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
} {
  // TODO: Implement actual streak calculation when date tracking is added
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null
  };
}

/**
 * Gets next milestone information
 */
export function getNextMilestone(completedLessons: number, totalLessons: number): {
  nextMilestone: number;
  lessonsToMilestone: number;
  milestoneMessage: string;
} {
  const milestones = [1, 3, 5, 7, 10]; // Lesson milestones
  const nextMilestone = milestones.find(milestone => milestone > completedLessons) || totalLessons;
  const lessonsToMilestone = nextMilestone - completedLessons;
  
  let milestoneMessage = "";
  if (nextMilestone === 1) {
    milestoneMessage = "Complete your first lesson!";
  } else if (nextMilestone === 3) {
    milestoneMessage = "Reach 3 lessons completed!";
  } else if (nextMilestone === 5) {
    milestoneMessage = "Complete half of Module 1!";
  } else if (nextMilestone === 7) {
    milestoneMessage = "You're getting close to finishing Module 1!";
  } else if (nextMilestone === 10) {
    milestoneMessage = "Complete all lessons and become a Python master!";
  } else {
    milestoneMessage = "You've achieved all milestones!";
  }

  return {
    nextMilestone,
    lessonsToMilestone,
    milestoneMessage
  };
}

/**
 * Determines if user should see encouragement message
 */
export function shouldShowEncouragement(userData: UserData): boolean {
  const analytics = progressAnalyticsService.calculateProgressAnalytics(userData);
  
  // Show encouragement if user has started but completed less than 50%
  return analytics.completedLessons > 0 && analytics.completionPercentage < 50;
}

/**
 * Gets personalized encouragement message
 */
export function getEncouragementMessage(userData: UserData): string {
  const analytics = progressAnalyticsService.calculateProgressAnalytics(userData);
  const { completedLessons, completionPercentage } = analytics;
  
  const messages = [
    `You've completed ${completedLessons} lessons! That's awesome! 🌟`,
    `${completionPercentage}% complete! You're doing great! 💪`,
    "Every lesson brings you closer to becoming a Python expert! 🐍",
    "Keep up the fantastic work! You've got this! 🚀",
    "Your coding skills are growing with each lesson! 📈"
  ];
  
  // Return a random encouragement message
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Validates if a lesson exists in the curriculum
 */
export function isValidLessonPath(moduleId: string, topicId: string): boolean {
  return progressAnalyticsService.validateProgressData({
    [moduleId]: {
      [topicId]: { completed: false }
    }
  }).isValid;
}

/**
 * Gets time-based greeting
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

/**
 * Formats last active lesson for display
 */
export function formatLastActiveLesson(lastActiveLesson: {
  moduleId: string;
  topicId: string;
  title: string;
  moduleName: string;
} | null): string {
  if (!lastActiveLesson) {
    return "No lessons started yet";
  }
  
  return `${lastActiveLesson.title} (${lastActiveLesson.moduleName})`;
}