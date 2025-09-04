import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressAnalyticsService } from '../ProgressAnalytics';
import { UserData } from '../../contexts/UserContext';

describe('ProgressAnalyticsService', () => {
  let service: ProgressAnalyticsService;
  let mockUserData: UserData;

  beforeEach(() => {
    service = ProgressAnalyticsService.getInstance();
    
    // Mock user data with some completed lessons
    mockUserData = {
      id: 'test-user',
      email: 'test@example.com',
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
  });

  describe('calculateProgressAnalytics', () => {
    it('should calculate correct total lessons count', () => {
      const analytics = service.calculateProgressAnalytics(mockUserData);
      expect(analytics.totalLessons).toBe(10); // 5 lessons per module, 2 modules
    });

    it('should calculate correct completed lessons count', () => {
      const analytics = service.calculateProgressAnalytics(mockUserData);
      expect(analytics.completedLessons).toBe(3); // topic1, topic2, topic6
    });

    it('should calculate correct completion percentage', () => {
      const analytics = service.calculateProgressAnalytics(mockUserData);
      expect(analytics.completionPercentage).toBe(30); // 3/10 = 30%
    });

    it('should return correct last active lesson info', () => {
      const analytics = service.calculateProgressAnalytics(mockUserData);
      expect(analytics.lastActiveLesson).toEqual({
        moduleId: 'module1',
        topicId: 'topic3',
        title: 'Why is Python a High-Level Language?',
        moduleName: 'Introduction to Python (Basics)'
      });
    });

    it('should calculate module progress correctly', () => {
      const analytics = service.calculateProgressAnalytics(mockUserData);
      
      expect(analytics.moduleProgress).toHaveLength(2);
      
      // Module 1: 2 completed out of 5 = 40%
      expect(analytics.moduleProgress[0]).toEqual({
        moduleId: 'module1',
        moduleName: 'Introduction to Python (Basics)',
        totalLessons: 5,
        completedLessons: 2,
        percentage: 40
      });

      // Module 2: 1 completed out of 5 = 20%
      expect(analytics.moduleProgress[1]).toEqual({
        moduleId: 'module2',
        moduleName: 'Python Operations & Control Flow',
        totalLessons: 5,
        completedLessons: 1,
        percentage: 20
      });
    });
  });

  describe('getCompletedLessonsCount', () => {
    it('should count completed lessons correctly', () => {
      const count = service.getCompletedLessonsCount(mockUserData.progress);
      expect(count).toBe(3);
    });

    it('should return 0 for empty progress', () => {
      const count = service.getCompletedLessonsCount({});
      expect(count).toBe(0);
    });

    it('should handle partial module progress', () => {
      const partialProgress = {
        module1: {
          topic1: { completed: true, score: 10 }
        }
      };
      const count = service.getCompletedLessonsCount(partialProgress);
      expect(count).toBe(1);
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(service.calculateCompletionPercentage(3, 10)).toBe(30);
      expect(service.calculateCompletionPercentage(5, 10)).toBe(50);
      expect(service.calculateCompletionPercentage(10, 10)).toBe(100);
    });

    it('should handle zero total lessons', () => {
      expect(service.calculateCompletionPercentage(0, 0)).toBe(0);
    });

    it('should round percentages correctly', () => {
      expect(service.calculateCompletionPercentage(1, 3)).toBe(33); // 33.33... rounded to 33
      expect(service.calculateCompletionPercentage(2, 3)).toBe(67); // 66.66... rounded to 67
    });
  });

  describe('calculateModuleProgress', () => {
    it('should calculate progress for all modules', () => {
      const moduleProgress = service.calculateModuleProgress(mockUserData.progress);
      expect(moduleProgress).toHaveLength(2);
    });

    it('should handle modules with no progress', () => {
      const emptyProgress = {};
      const moduleProgress = service.calculateModuleProgress(emptyProgress);
      
      expect(moduleProgress[0]).toEqual({
        moduleId: 'module1',
        moduleName: 'Introduction to Python (Basics)',
        totalLessons: 5,
        completedLessons: 0,
        percentage: 0
      });
    });

    it('should calculate correct percentages for each module', () => {
      const moduleProgress = service.calculateModuleProgress(mockUserData.progress);
      
      expect(moduleProgress[0].percentage).toBe(40); // 2/5 = 40%
      expect(moduleProgress[1].percentage).toBe(20); // 1/5 = 20%
    });
  });

  describe('getLastActiveLessonInfo', () => {
    it('should return correct lesson info when last active lesson exists', () => {
      const info = service.getLastActiveLessonInfo(mockUserData.lastActiveLesson);
      expect(info).toEqual({
        moduleId: 'module1',
        topicId: 'topic3',
        title: 'Why is Python a High-Level Language?',
        moduleName: 'Introduction to Python (Basics)'
      });
    });

    it('should return null when no last active lesson', () => {
      const info = service.getLastActiveLessonInfo(null);
      expect(info).toBeNull();
    });

    it('should return null for invalid lesson reference', () => {
      const invalidLesson = { moduleId: 'invalid', topicId: 'invalid' };
      const info = service.getLastActiveLessonInfo(invalidLesson);
      expect(info).toBeNull();
    });
  });

  describe('hasResumableLesson', () => {
    it('should return true when user has last active lesson', () => {
      expect(service.hasResumableLesson(mockUserData)).toBe(true);
    });

    it('should return false when user has no last active lesson', () => {
      const userWithoutActive = { ...mockUserData, lastActiveLesson: null };
      expect(service.hasResumableLesson(userWithoutActive)).toBe(false);
    });

    it('should return false when last active lesson is undefined', () => {
      const userWithoutActive = { ...mockUserData, lastActiveLesson: undefined };
      expect(service.hasResumableLesson(userWithoutActive)).toBe(false);
    });
  });

  describe('getNextRecommendedLesson', () => {
    it('should recommend next lesson when current is completed', () => {
      const userWithCompletedActive = {
        ...mockUserData,
        lastActiveLesson: { moduleId: 'module1', topicId: 'topic1' },
        progress: {
          ...mockUserData.progress,
          module1: {
            ...mockUserData.progress.module1,
            topic1: { completed: true, score: 10 }
          }
        }
      };

      const recommendation = service.getNextRecommendedLesson(userWithCompletedActive);
      expect(recommendation).toEqual({
        moduleId: 'module1',
        topicId: 'topic2'
      });
    });

    it('should recommend current lesson when not completed', () => {
      const recommendation = service.getNextRecommendedLesson(mockUserData);
      expect(recommendation).toEqual({
        moduleId: 'module1',
        topicId: 'topic3'
      });
    });

    it('should recommend first incomplete lesson when no last active', () => {
      const userWithoutActive = { ...mockUserData, lastActiveLesson: null };
      const recommendation = service.getNextRecommendedLesson(userWithoutActive);
      expect(recommendation).toEqual({
        moduleId: 'module1',
        topicId: 'topic1'
      });
    });

    it('should return null when all lessons are completed', () => {
      const fullyCompletedUser: UserData = {
        ...mockUserData,
        progress: {
          module1: {
            topic1: { completed: true, score: 10 },
            topic2: { completed: true, score: 10 },
            topic3: { completed: true, score: 10 },
            topic4: { completed: true, score: 10 },
            topic5: { completed: true, score: 10 }
          },
          module2: {
            topic6: { completed: true, score: 10 },
            topic7: { completed: true, score: 10 },
            topic8: { completed: true, score: 10 },
            topic9: { completed: true, score: 10 },
            topic10: { completed: true, score: 10 }
          }
        }
      };

      const recommendation = service.getNextRecommendedLesson(fullyCompletedUser);
      expect(recommendation).toBeNull();
    });
  });

  describe('calculateAverageScore', () => {
    it('should calculate average score correctly', () => {
      const average = service.calculateAverageScore(mockUserData.progress);
      expect(average).toBe(9); // (10 + 8 + 9) / 3 = 9
    });

    it('should return 0 for no completed lessons', () => {
      const emptyProgress = {};
      const average = service.calculateAverageScore(emptyProgress);
      expect(average).toBe(0);
    });

    it('should ignore incomplete lessons in average calculation', () => {
      const progressWithIncomplete = {
        module1: {
          topic1: { completed: true, score: 10 },
          topic2: { completed: false, score: 5 } // Should be ignored
        }
      };
      const average = service.calculateAverageScore(progressWithIncomplete);
      expect(average).toBe(10);
    });
  });

  describe('getProgressSummary', () => {
    it('should return comprehensive progress summary', () => {
      const summary = service.getProgressSummary(mockUserData);
      
      expect(summary.totalLessons).toBe(10);
      expect(summary.completedLessons).toBe(3);
      expect(summary.inProgressLessons).toBe(1); // topic3 has score but not completed
      expect(summary.averageScore).toBe(9);
      expect(summary.lastActiveDate).toBe('2024-01-03T10:00:00Z');
    });
  });

  describe('isLessonCompleted', () => {
    it('should return true for completed lessons', () => {
      expect(service.isLessonCompleted(mockUserData.progress, 'module1', 'topic1')).toBe(true);
    });

    it('should return false for incomplete lessons', () => {
      expect(service.isLessonCompleted(mockUserData.progress, 'module1', 'topic3')).toBe(false);
    });

    it('should return false for non-existent lessons', () => {
      expect(service.isLessonCompleted(mockUserData.progress, 'invalid', 'invalid')).toBe(false);
    });
  });

  describe('getModuleCompletionStatus', () => {
    it('should return correct completion status for module', () => {
      const status = service.getModuleCompletionStatus(mockUserData.progress, 'module1');
      
      expect(status.isCompleted).toBe(false);
      expect(status.completedLessons).toBe(2);
      expect(status.totalLessons).toBe(5);
      expect(status.percentage).toBe(40);
    });

    it('should handle completed modules', () => {
      const completedProgress = {
        module1: {
          topic1: { completed: true, score: 10 },
          topic2: { completed: true, score: 10 },
          topic3: { completed: true, score: 10 },
          topic4: { completed: true, score: 10 },
          topic5: { completed: true, score: 10 }
        }
      };

      const status = service.getModuleCompletionStatus(completedProgress, 'module1');
      expect(status.isCompleted).toBe(true);
      expect(status.percentage).toBe(100);
    });

    it('should handle invalid module IDs', () => {
      const status = service.getModuleCompletionStatus(mockUserData.progress, 'invalid');
      
      expect(status.isCompleted).toBe(false);
      expect(status.completedLessons).toBe(0);
      expect(status.totalLessons).toBe(0);
      expect(status.percentage).toBe(0);
    });
  });

  describe('validateProgressData', () => {
    it('should validate correct progress data', () => {
      const validation = service.validateProgressData(mockUserData.progress);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid module IDs', () => {
      const invalidProgress = {
        invalidModule: {
          topic1: { completed: true, score: 10 }
        }
      };

      const validation = service.validateProgressData(invalidProgress);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid module ID: invalidModule');
    });

    it('should detect invalid lesson IDs', () => {
      const invalidProgress = {
        module1: {
          invalidTopic: { completed: true, score: 10 }
        }
      };

      const validation = service.validateProgressData(invalidProgress);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid lesson ID: invalidTopic in module module1');
    });

    it('should detect multiple validation errors', () => {
      const invalidProgress = {
        invalidModule: {
          topic1: { completed: true, score: 10 }
        },
        module1: {
          invalidTopic: { completed: true, score: 10 }
        }
      };

      const validation = service.validateProgressData(invalidProgress);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ProgressAnalyticsService.getInstance();
      const instance2 = ProgressAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});