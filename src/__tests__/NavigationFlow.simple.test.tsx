import { describe, it, expect } from 'vitest';
import { navigationService } from '../services/NavigationService';
import { curriculum } from '../data/curriculum';

describe('Navigation Flow - Service Tests', () => {
  it('should have correct total lesson count', () => {
    const totalLessons = navigationService.getTotalLessonCount();
    expect(totalLessons).toBe(10);
  });

  it('should navigate through all lessons sequentially', () => {
    // Get all lessons in order
    const allLessons = curriculum.flatMap(module => 
      module.lessons.map(lesson => ({ moduleId: module.id, topicId: lesson.id }))
    );

    // Test each lesson's navigation state
    allLessons.forEach((lesson, index) => {
      const navigationState = navigationService.getNavigationState(lesson.moduleId, lesson.topicId);
      
      if (index === 0) {
        // First lesson
        expect(navigationState.canGoPrevious).toBe(false);
        expect(navigationState.canGoNext).toBe(true);
        expect(navigationState.nextDestination).toBe('lesson');
      } else if (index === allLessons.length - 1) {
        // Last lesson
        expect(navigationState.canGoPrevious).toBe(true);
        expect(navigationState.canGoNext).toBe(false);
        expect(navigationState.nextDestination).toBe('dashboard');
      } else {
        // Middle lessons
        expect(navigationState.canGoPrevious).toBe(true);
        expect(navigationState.canGoNext).toBe(true);
        expect(navigationState.nextDestination).toBe('lesson');
      }
    });
  });

  it('should correctly identify module transitions', () => {
    // Test transition from module1 to module2
    const nextLesson = navigationService.getNextLesson('module1', 'topic5');
    
    expect(nextLesson).toEqual({
      moduleId: 'module2',
      topicId: 'topic6',
      title: 'Strings in Python',
      isModuleTransition: true,
    });
  });

  it('should handle first and last lesson edge cases', () => {
    // First lesson
    expect(navigationService.isFirstLesson('module1', 'topic1')).toBe(true);
    expect(navigationService.getPreviousLesson('module1', 'topic1')).toBe(null);
    
    // Last lesson
    expect(navigationService.isLastLesson('module2', 'topic10')).toBe(true);
    expect(navigationService.getNextLesson('module2', 'topic10')).toBe(null);
  });

  it('should validate lesson existence correctly', () => {
    // Valid lessons
    expect(navigationService.isValidLesson('module1', 'topic1')).toBe(true);
    expect(navigationService.isValidLesson('module2', 'topic10')).toBe(true);
    
    // Invalid lessons
    expect(navigationService.isValidLesson('module3', 'topic1')).toBe(false);
    expect(navigationService.isValidLesson('module1', 'topic11')).toBe(false);
  });

  it('should calculate correct lesson indices', () => {
    // First lesson should be index 0
    expect(navigationService.getCurrentLessonIndex('module1', 'topic1')).toBe(0);
    
    // Last lesson of module1 should be index 4
    expect(navigationService.getCurrentLessonIndex('module1', 'topic5')).toBe(4);
    
    // First lesson of module2 should be index 5
    expect(navigationService.getCurrentLessonIndex('module2', 'topic6')).toBe(5);
    
    // Last lesson should be index 9
    expect(navigationService.getCurrentLessonIndex('module2', 'topic10')).toBe(9);
  });

  it('should provide correct progress percentage calculations', () => {
    expect(navigationService.getProgressPercentage(0)).toBe(0);
    expect(navigationService.getProgressPercentage(5)).toBe(50);
    expect(navigationService.getProgressPercentage(10)).toBe(100);
  });
});