import { describe, it, expect } from 'vitest';
import {
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
} from '../navigationUtils';

describe('navigationUtils', () => {
  describe('calculateGlobalLessonIndex', () => {
    it('should return correct global index', () => {
      expect(calculateGlobalLessonIndex('module1', 'topic1')).toBe(0);
      expect(calculateGlobalLessonIndex('module1', 'topic5')).toBe(4);
      expect(calculateGlobalLessonIndex('module2', 'topic6')).toBe(5);
      expect(calculateGlobalLessonIndex('module2', 'topic10')).toBe(9);
    });

    it('should return -1 for invalid lessons', () => {
      expect(calculateGlobalLessonIndex('invalid', 'topic1')).toBe(-1);
      expect(calculateGlobalLessonIndex('module1', 'invalid')).toBe(-1);
    });
  });

  describe('getEnhancedNavigationState', () => {
    it('should return enhanced state for first lesson', () => {
      const state = getEnhancedNavigationState('module1', 'topic1');
      expect(state).toEqual({
        canGoNext: true,
        canGoPrevious: false,
        nextDestination: 'lesson',
        previousAvailable: false,
        currentIndex: 0,
        totalLessons: 10,
        progressPercentage: 10
      });
    });

    it('should return enhanced state for middle lesson', () => {
      const state = getEnhancedNavigationState('module1', 'topic3');
      expect(state).toEqual({
        canGoNext: true,
        canGoPrevious: true,
        nextDestination: 'lesson',
        previousAvailable: true,
        currentIndex: 2,
        totalLessons: 10,
        progressPercentage: 30
      });
    });

    it('should return enhanced state for last lesson', () => {
      const state = getEnhancedNavigationState('module2', 'topic10');
      expect(state).toEqual({
        canGoNext: false,
        canGoPrevious: true,
        nextDestination: 'dashboard',
        previousAvailable: true,
        currentIndex: 9,
        totalLessons: 10,
        progressPercentage: 100
      });
    });
  });

  describe('generateLessonRoute', () => {
    it('should generate correct lesson routes', () => {
      expect(generateLessonRoute('module1', 'topic1')).toBe('/lesson/module1/topic1');
      expect(generateLessonRoute('module2', 'topic10')).toBe('/lesson/module2/topic10');
    });
  });

  describe('generateNextRoute', () => {
    it('should generate next lesson route', () => {
      expect(generateNextRoute('module1', 'topic1')).toBe('/lesson/module1/topic2');
      expect(generateNextRoute('module1', 'topic5')).toBe('/lesson/module2/topic6');
    });

    it('should generate dashboard route for last lesson', () => {
      expect(generateNextRoute('module2', 'topic10')).toBe('/dashboard');
    });
  });

  describe('generatePreviousRoute', () => {
    it('should generate previous lesson route', () => {
      expect(generatePreviousRoute('module1', 'topic2')).toBe('/lesson/module1/topic1');
      expect(generatePreviousRoute('module2', 'topic6')).toBe('/lesson/module1/topic5');
    });

    it('should return null for first lesson', () => {
      expect(generatePreviousRoute('module1', 'topic1')).toBeNull();
    });
  });

  describe('getLessonContext', () => {
    it('should return correct context for valid lesson', () => {
      const context = getLessonContext('module1', 'topic1');
      expect(context).toEqual({
        lessonTitle: 'What is Programming?',
        moduleTitle: 'Introduction to Python (Basics)',
        lessonNumber: 1,
        totalLessons: 10,
        isFirstInModule: true,
        isLastInModule: false
      });
    });

    it('should return correct context for last lesson of module', () => {
      const context = getLessonContext('module1', 'topic5');
      expect(context).toEqual({
        lessonTitle: 'Data Types in Python',
        moduleTitle: 'Introduction to Python (Basics)',
        lessonNumber: 5,
        totalLessons: 10,
        isFirstInModule: false,
        isLastInModule: true
      });
    });

    it('should return null for invalid lesson', () => {
      expect(getLessonContext('invalid', 'topic1')).toBeNull();
    });
  });

  describe('getNavigationButtonStates', () => {
    it('should return correct button states for first lesson', () => {
      const states = getNavigationButtonStates('module1', 'topic1');
      expect(states).toEqual({
        previousButton: {
          enabled: false,
          route: null,
          tooltip: 'This is the first lesson'
        },
        nextButton: {
          enabled: true,
          route: '/lesson/module1/topic2',
          tooltip: 'Go to next lesson',
          isCompletionButton: false
        }
      });
    });

    it('should return correct button states for module transition', () => {
      const states = getNavigationButtonStates('module1', 'topic5');
      expect(states).toEqual({
        previousButton: {
          enabled: true,
          route: '/lesson/module1/topic4',
          tooltip: 'Go to previous lesson'
        },
        nextButton: {
          enabled: true,
          route: '/lesson/module2/topic6',
          tooltip: 'Continue to next module: Strings in Python',
          isCompletionButton: false
        }
      });
    });

    it('should return correct button states for last lesson', () => {
      const states = getNavigationButtonStates('module2', 'topic10');
      expect(states).toEqual({
        previousButton: {
          enabled: true,
          route: '/lesson/module2/topic9',
          tooltip: 'Go to previous lesson'
        },
        nextButton: {
          enabled: true,
          route: '/dashboard',
          tooltip: 'Complete course and return to dashboard',
          isCompletionButton: true
        }
      });
    });
  });

  describe('validateLessonParams', () => {
    it('should validate correct lesson params', () => {
      const result = validateLessonParams('module1', 'topic1');
      expect(result).toEqual({ isValid: true });
    });

    it('should invalidate empty params', () => {
      const result1 = validateLessonParams('', 'topic1');
      expect(result1).toEqual({
        isValid: false,
        error: 'Module ID and Topic ID are required'
      });

      const result2 = validateLessonParams('module1', '');
      expect(result2).toEqual({
        isValid: false,
        error: 'Module ID and Topic ID are required'
      });
    });

    it('should invalidate non-existent lessons', () => {
      const result = validateLessonParams('invalid', 'topic1');
      expect(result).toEqual({
        isValid: false,
        error: 'Lesson not found: invalid/topic1'
      });
    });
  });

  describe('getBreadcrumbData', () => {
    it('should return correct breadcrumb data', () => {
      const breadcrumbs = getBreadcrumbData('module1', 'topic1');
      expect(breadcrumbs).toEqual({
        items: [
          {
            label: 'Dashboard',
            route: '/dashboard',
            isActive: false
          },
          {
            label: 'Introduction to Python (Basics)',
            route: '/module/module1',
            isActive: false
          },
          {
            label: 'What is Programming?',
            route: '/lesson/module1/topic1',
            isActive: true
          }
        ]
      });
    });

    it('should return empty items for invalid lesson', () => {
      const breadcrumbs = getBreadcrumbData('invalid', 'topic1');
      expect(breadcrumbs).toEqual({ items: [] });
    });
  });

  describe('getModuleProgress', () => {
    it('should calculate correct module progress', () => {
      const completedLessons = new Set(['module1-topic1', 'module1-topic2', 'module1-topic3']);
      const progress = getModuleProgress('module1', completedLessons);
      
      expect(progress).toEqual({
        moduleTitle: 'Introduction to Python (Basics)',
        totalLessons: 5,
        completedCount: 3,
        progressPercentage: 60,
        lessons: [
          {
            topicId: 'topic1',
            title: 'What is Programming?',
            completed: true,
            route: '/lesson/module1/topic1'
          },
          {
            topicId: 'topic2',
            title: 'What is Python?',
            completed: true,
            route: '/lesson/module1/topic2'
          },
          {
            topicId: 'topic3',
            title: 'Why is Python a High-Level Language?',
            completed: true,
            route: '/lesson/module1/topic3'
          },
          {
            topicId: 'topic4',
            title: 'Variables in Python',
            completed: false,
            route: '/lesson/module1/topic4'
          },
          {
            topicId: 'topic5',
            title: 'Data Types in Python',
            completed: false,
            route: '/lesson/module1/topic5'
          }
        ]
      });
    });

    it('should return null for invalid module', () => {
      const completedLessons = new Set<string>();
      const progress = getModuleProgress('invalid', completedLessons);
      expect(progress).toBeNull();
    });

    it('should handle empty completed lessons', () => {
      const completedLessons = new Set<string>();
      const progress = getModuleProgress('module1', completedLessons);
      
      expect(progress?.completedCount).toBe(0);
      expect(progress?.progressPercentage).toBe(0);
      expect(progress?.lessons.every(l => !l.completed)).toBe(true);
    });
  });

  describe('getCurriculumProgress', () => {
    it('should calculate correct overall progress', () => {
      const completedLessons = new Set([
        'module1-topic1', 'module1-topic2', 'module1-topic3',
        'module2-topic6', 'module2-topic7'
      ]);
      
      const progress = getCurriculumProgress(completedLessons);
      
      expect(progress).toEqual({
        totalLessons: 10,
        completedCount: 5,
        progressPercentage: 50,
        modules: [
          {
            moduleId: 'module1',
            moduleTitle: 'Introduction to Python (Basics)',
            completedCount: 3,
            totalLessons: 5,
            progressPercentage: 60
          },
          {
            moduleId: 'module2',
            moduleTitle: 'Python Operations & Control Flow',
            completedCount: 2,
            totalLessons: 5,
            progressPercentage: 40
          }
        ]
      });
    });

    it('should handle empty completed lessons', () => {
      const completedLessons = new Set<string>();
      const progress = getCurriculumProgress(completedLessons);
      
      expect(progress.completedCount).toBe(0);
      expect(progress.progressPercentage).toBe(0);
      expect(progress.modules.every(m => m.completedCount === 0)).toBe(true);
      expect(progress.modules.every(m => m.progressPercentage === 0)).toBe(true);
    });

    it('should handle all lessons completed', () => {
      const completedLessons = new Set([
        'module1-topic1', 'module1-topic2', 'module1-topic3', 'module1-topic4', 'module1-topic5',
        'module2-topic6', 'module2-topic7', 'module2-topic8', 'module2-topic9', 'module2-topic10'
      ]);
      
      const progress = getCurriculumProgress(completedLessons);
      
      expect(progress.completedCount).toBe(10);
      expect(progress.progressPercentage).toBe(100);
      expect(progress.modules.every(m => m.progressPercentage === 100)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed lesson identifiers in completed set', () => {
      const completedLessons = new Set([
        'module1-topic1',
        'invalid-format',
        'module2-topic6',
        'another-invalid',
        ''
      ]);
      
      const progress = getCurriculumProgress(completedLessons);
      expect(progress.completedCount).toBe(2); // Only valid ones counted
    });

    it('should handle percentage rounding correctly', () => {
      // Test with 3 out of 10 lessons (30%)
      const completedLessons = new Set(['module1-topic1', 'module1-topic2', 'module1-topic3']);
      const progress = getCurriculumProgress(completedLessons);
      expect(progress.progressPercentage).toBe(30);
      
      // Module1 has 3 out of 5 (60%)
      const module1Progress = progress.modules.find(m => m.moduleId === 'module1');
      expect(module1Progress?.progressPercentage).toBe(60);
    });
  });
});