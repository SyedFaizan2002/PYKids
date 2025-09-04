import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatCompletionPercentage,
  formatLessonCount,
  getProgressStatusMessage,
  getProgressEmoji,
  getNextMilestone,
  shouldShowEncouragement,
  getEncouragementMessage,
  getTimeBasedGreeting,
  formatLastActiveLesson
} from '../progressUtils';
import { UserData } from '../../contexts/UserContext';

describe('progressUtils', () => {
  let mockUserData: UserData;

  beforeEach(() => {
    mockUserData = {
      id: 'test-user',
      email: 'test@example.com',
      progress: {
        module1: {
          topic1: { completed: true, score: 10 },
          topic2: { completed: true, score: 8 },
          topic3: { completed: false }
        }
      },
      totalScore: 18,
      lastActiveLesson: {
        moduleId: 'module1',
        topicId: 'topic3'
      }
    };
  });

  describe('formatCompletionPercentage', () => {
    it('should format percentage with % symbol', () => {
      expect(formatCompletionPercentage(75)).toBe('75%');
      expect(formatCompletionPercentage(0)).toBe('0%');
      expect(formatCompletionPercentage(100)).toBe('100%');
    });
  });

  describe('formatLessonCount', () => {
    it('should format lesson count correctly', () => {
      expect(formatLessonCount(3, 10)).toBe('3 of 10 lessons');
      expect(formatLessonCount(0, 5)).toBe('0 of 5 lessons');
      expect(formatLessonCount(10, 10)).toBe('10 of 10 lessons');
    });
  });

  describe('getProgressStatusMessage', () => {
    it('should return appropriate message for 0% completion', () => {
      const message = getProgressStatusMessage(0, 10);
      expect(message).toBe("Ready to start your Python journey! 🚀");
    });

    it('should return appropriate message for < 25% completion', () => {
      const message = getProgressStatusMessage(2, 10);
      expect(message).toBe("Great start! Keep going! 💪");
    });

    it('should return appropriate message for < 50% completion', () => {
      const message = getProgressStatusMessage(3, 10);
      expect(message).toBe("You're making excellent progress! 🌟");
    });

    it('should return appropriate message for < 75% completion', () => {
      const message = getProgressStatusMessage(6, 10);
      expect(message).toBe("More than halfway there! Amazing work! 🎯");
    });

    it('should return appropriate message for < 100% completion', () => {
      const message = getProgressStatusMessage(8, 10);
      expect(message).toBe("Almost finished! You're doing fantastic! 🏆");
    });

    it('should return appropriate message for 100% completion', () => {
      const message = getProgressStatusMessage(10, 10);
      expect(message).toBe("Congratulations! You've completed all lessons! 🎉");
    });
  });

  describe('getProgressEmoji', () => {
    it('should return correct emoji for different percentages', () => {
      expect(getProgressEmoji(0)).toBe('🌱');
      expect(getProgressEmoji(20)).toBe('🌿');
      expect(getProgressEmoji(40)).toBe('🌳');
      expect(getProgressEmoji(60)).toBe('🌟');
      expect(getProgressEmoji(80)).toBe('🏆');
      expect(getProgressEmoji(100)).toBe('🎉');
    });
  });

  describe('getNextMilestone', () => {
    it('should return correct next milestone for early progress', () => {
      const milestone = getNextMilestone(0, 10);
      expect(milestone.nextMilestone).toBe(1);
      expect(milestone.lessonsToMilestone).toBe(1);
      expect(milestone.milestoneMessage).toBe("Complete your first lesson!");
    });

    it('should return correct next milestone for mid progress', () => {
      const milestone = getNextMilestone(2, 10);
      expect(milestone.nextMilestone).toBe(3);
      expect(milestone.lessonsToMilestone).toBe(1);
      expect(milestone.milestoneMessage).toBe("Reach 3 lessons completed!");
    });

    it('should return correct milestone for completed progress', () => {
      const milestone = getNextMilestone(10, 10);
      expect(milestone.nextMilestone).toBe(10);
      expect(milestone.lessonsToMilestone).toBe(0);
      expect(milestone.milestoneMessage).toBe("You've achieved all milestones!");
    });
  });

  describe('shouldShowEncouragement', () => {
    it('should return true for users with some progress but < 50%', () => {
      const result = shouldShowEncouragement(mockUserData);
      expect(result).toBe(true);
    });

    it('should return false for users with no progress', () => {
      const userWithNoProgress = {
        ...mockUserData,
        progress: {}
      };
      const result = shouldShowEncouragement(userWithNoProgress);
      expect(result).toBe(false);
    });
  });

  describe('getEncouragementMessage', () => {
    it('should return a string message', () => {
      const message = getEncouragementMessage(mockUserData);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should include progress information', () => {
      // Mock Math.random to return consistent result
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      
      const message = getEncouragementMessage(mockUserData);
      expect(message).toContain('lessons');
      
      vi.restoreAllMocks();
    });
  });

  describe('getTimeBasedGreeting', () => {
    it('should return morning greeting for early hours', () => {
      // Mock Date to return 9 AM
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      
      const greeting = getTimeBasedGreeting();
      expect(greeting).toBe('Good morning');
      
      vi.restoreAllMocks();
    });

    it('should return afternoon greeting for afternoon hours', () => {
      // Mock Date to return 2 PM
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
      
      const greeting = getTimeBasedGreeting();
      expect(greeting).toBe('Good afternoon');
      
      vi.restoreAllMocks();
    });

    it('should return evening greeting for evening hours', () => {
      // Mock Date to return 8 PM
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
      
      const greeting = getTimeBasedGreeting();
      expect(greeting).toBe('Good evening');
      
      vi.restoreAllMocks();
    });
  });

  describe('formatLastActiveLesson', () => {
    it('should format last active lesson correctly', () => {
      const lastActiveLesson = {
        moduleId: 'module1',
        topicId: 'topic3',
        title: 'Variables in Python',
        moduleName: 'Introduction to Python'
      };

      const formatted = formatLastActiveLesson(lastActiveLesson);
      expect(formatted).toBe('Variables in Python (Introduction to Python)');
    });

    it('should handle null last active lesson', () => {
      const formatted = formatLastActiveLesson(null);
      expect(formatted).toBe('No lessons started yet');
    });
  });
});