import { describe, it, expect, beforeEach } from 'vitest';
import { NavigationService, navigationService } from '../NavigationService';

describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    service = NavigationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NavigationService.getInstance();
      const instance2 = NavigationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should be the same as the exported navigationService', () => {
      expect(service).toBe(navigationService);
    });
  });

  describe('Lesson Sequence Building', () => {
    it('should build correct lesson sequence', () => {
      const sequence = service.getLessonSequence();
      expect(sequence).toHaveLength(10); // 5 lessons in module1 + 5 lessons in module2
      
      // Check first lesson
      expect(sequence[0]).toEqual({
        globalIndex: 0,
        moduleId: 'module1',
        topicId: 'topic1',
        title: 'What is Programming?',
        moduleTitle: 'Introduction to Python (Basics)',
        isFirstInModule: true,
        isLastInModule: false,
        isFirstOverall: true,
        isLastOverall: false
      });

      // Check last lesson
      expect(sequence[9]).toEqual({
        globalIndex: 9,
        moduleId: 'module2',
        topicId: 'topic10',
        title: 'Loops in Python',
        moduleTitle: 'Python Operations & Control Flow',
        isFirstInModule: false,
        isLastInModule: true,
        isFirstOverall: false,
        isLastOverall: true
      });
    });

    it('should correctly identify module boundaries', () => {
      const sequence = service.getLessonSequence();
      
      // Last lesson of module1
      const lastModule1 = sequence.find(l => l.moduleId === 'module1' && l.topicId === 'topic5');
      expect(lastModule1?.isLastInModule).toBe(true);
      expect(lastModule1?.isFirstInModule).toBe(false);
      
      // First lesson of module2
      const firstModule2 = sequence.find(l => l.moduleId === 'module2' && l.topicId === 'topic6');
      expect(firstModule2?.isFirstInModule).toBe(true);
      expect(firstModule2?.isLastInModule).toBe(false);
    });
  });

  describe('getCurrentLessonIndex', () => {
    it('should return correct index for valid lessons', () => {
      expect(service.getCurrentLessonIndex('module1', 'topic1')).toBe(0);
      expect(service.getCurrentLessonIndex('module1', 'topic5')).toBe(4);
      expect(service.getCurrentLessonIndex('module2', 'topic6')).toBe(5);
      expect(service.getCurrentLessonIndex('module2', 'topic10')).toBe(9);
    });

    it('should return -1 for invalid lessons', () => {
      expect(service.getCurrentLessonIndex('invalid', 'topic1')).toBe(-1);
      expect(service.getCurrentLessonIndex('module1', 'invalid')).toBe(-1);
      expect(service.getCurrentLessonIndex('', '')).toBe(-1);
    });
  });

  describe('getNextLesson', () => {
    it('should return next lesson within same module', () => {
      const next = service.getNextLesson('module1', 'topic1');
      expect(next).toEqual({
        moduleId: 'module1',
        topicId: 'topic2',
        title: 'What is Python?',
        isModuleTransition: false
      });
    });

    it('should return next lesson across modules', () => {
      const next = service.getNextLesson('module1', 'topic5');
      expect(next).toEqual({
        moduleId: 'module2',
        topicId: 'topic6',
        title: 'Strings in Python',
        isModuleTransition: true
      });
    });

    it('should return null for last lesson', () => {
      const next = service.getNextLesson('module2', 'topic10');
      expect(next).toBeNull();
    });

    it('should return null for invalid lessons', () => {
      const next = service.getNextLesson('invalid', 'topic1');
      expect(next).toBeNull();
    });
  });

  describe('getPreviousLesson', () => {
    it('should return previous lesson within same module', () => {
      const previous = service.getPreviousLesson('module1', 'topic2');
      expect(previous).toEqual({
        moduleId: 'module1',
        topicId: 'topic1',
        title: 'What is Programming?',
        isModuleTransition: false
      });
    });

    it('should return previous lesson across modules', () => {
      const previous = service.getPreviousLesson('module2', 'topic6');
      expect(previous).toEqual({
        moduleId: 'module1',
        topicId: 'topic5',
        title: 'Data Types in Python',
        isModuleTransition: true
      });
    });

    it('should return null for first lesson', () => {
      const previous = service.getPreviousLesson('module1', 'topic1');
      expect(previous).toBeNull();
    });

    it('should return null for invalid lessons', () => {
      const previous = service.getPreviousLesson('invalid', 'topic1');
      expect(previous).toBeNull();
    });
  });

  describe('isFirstLesson', () => {
    it('should return true for first lesson', () => {
      expect(service.isFirstLesson('module1', 'topic1')).toBe(true);
    });

    it('should return false for non-first lessons', () => {
      expect(service.isFirstLesson('module1', 'topic2')).toBe(false);
      expect(service.isFirstLesson('module2', 'topic6')).toBe(false);
      expect(service.isFirstLesson('module2', 'topic10')).toBe(false);
    });

    it('should return false for invalid lessons', () => {
      expect(service.isFirstLesson('invalid', 'topic1')).toBe(false);
    });
  });

  describe('isLastLesson', () => {
    it('should return true for last lesson', () => {
      expect(service.isLastLesson('module2', 'topic10')).toBe(true);
    });

    it('should return false for non-last lessons', () => {
      expect(service.isLastLesson('module1', 'topic1')).toBe(false);
      expect(service.isLastLesson('module1', 'topic5')).toBe(false);
      expect(service.isLastLesson('module2', 'topic6')).toBe(false);
    });

    it('should return false for invalid lessons', () => {
      expect(service.isLastLesson('invalid', 'topic1')).toBe(false);
    });
  });

  describe('getNavigationState', () => {
    it('should return correct state for first lesson', () => {
      const state = service.getNavigationState('module1', 'topic1');
      expect(state).toEqual({
        canGoNext: true,
        canGoPrevious: false,
        nextDestination: 'lesson',
        previousAvailable: false
      });
    });

    it('should return correct state for middle lesson', () => {
      const state = service.getNavigationState('module1', 'topic3');
      expect(state).toEqual({
        canGoNext: true,
        canGoPrevious: true,
        nextDestination: 'lesson',
        previousAvailable: true
      });
    });

    it('should return correct state for last lesson', () => {
      const state = service.getNavigationState('module2', 'topic10');
      expect(state).toEqual({
        canGoNext: false,
        canGoPrevious: true,
        nextDestination: 'dashboard',
        previousAvailable: true
      });
    });
  });

  describe('getLessonByIndex', () => {
    it('should return correct lesson for valid index', () => {
      const lesson = service.getLessonByIndex(0);
      expect(lesson?.moduleId).toBe('module1');
      expect(lesson?.topicId).toBe('topic1');
      expect(lesson?.globalIndex).toBe(0);
    });

    it('should return null for invalid index', () => {
      expect(service.getLessonByIndex(-1)).toBeNull();
      expect(service.getLessonByIndex(100)).toBeNull();
    });
  });

  describe('getLessonsInModule', () => {
    it('should return all lessons in module1', () => {
      const lessons = service.getLessonsInModule('module1');
      expect(lessons).toHaveLength(5);
      expect(lessons.every(l => l.moduleId === 'module1')).toBe(true);
      expect(lessons[0].topicId).toBe('topic1');
      expect(lessons[4].topicId).toBe('topic5');
    });

    it('should return all lessons in module2', () => {
      const lessons = service.getLessonsInModule('module2');
      expect(lessons).toHaveLength(5);
      expect(lessons.every(l => l.moduleId === 'module2')).toBe(true);
      expect(lessons[0].topicId).toBe('topic6');
      expect(lessons[4].topicId).toBe('topic10');
    });

    it('should return empty array for invalid module', () => {
      const lessons = service.getLessonsInModule('invalid');
      expect(lessons).toHaveLength(0);
    });
  });

  describe('getModuleInfo', () => {
    it('should return correct module info', () => {
      const module1 = service.getModuleInfo('module1');
      expect(module1?.id).toBe('module1');
      expect(module1?.title).toBe('Introduction to Python (Basics)');
      expect(module1?.lessons).toHaveLength(5);

      const module2 = service.getModuleInfo('module2');
      expect(module2?.id).toBe('module2');
      expect(module2?.title).toBe('Python Operations & Control Flow');
      expect(module2?.lessons).toHaveLength(5);
    });

    it('should return null for invalid module', () => {
      expect(service.getModuleInfo('invalid')).toBeNull();
    });
  });

  describe('getLessonInfo', () => {
    it('should return correct lesson info', () => {
      const lesson = service.getLessonInfo('module1', 'topic1');
      expect(lesson?.id).toBe('topic1');
      expect(lesson?.title).toBe('What is Programming?');
      expect(lesson?.hasExercise).toBe(false);
    });

    it('should return null for invalid lesson', () => {
      expect(service.getLessonInfo('invalid', 'topic1')).toBeNull();
      expect(service.getLessonInfo('module1', 'invalid')).toBeNull();
    });
  });

  describe('isValidLesson', () => {
    it('should return true for valid lessons', () => {
      expect(service.isValidLesson('module1', 'topic1')).toBe(true);
      expect(service.isValidLesson('module2', 'topic10')).toBe(true);
    });

    it('should return false for invalid lessons', () => {
      expect(service.isValidLesson('invalid', 'topic1')).toBe(false);
      expect(service.isValidLesson('module1', 'invalid')).toBe(false);
      expect(service.isValidLesson('', '')).toBe(false);
    });
  });

  describe('getTotalLessonCount', () => {
    it('should return correct total lesson count', () => {
      expect(service.getTotalLessonCount()).toBe(10);
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate correct progress percentage', () => {
      expect(service.getProgressPercentage(0)).toBe(0);
      expect(service.getProgressPercentage(5)).toBe(50);
      expect(service.getProgressPercentage(10)).toBe(100);
      expect(service.getProgressPercentage(3)).toBe(30);
    });

    it('should handle edge cases', () => {
      expect(service.getProgressPercentage(-1)).toBe(-10);
      expect(service.getProgressPercentage(15)).toBe(150);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings gracefully', () => {
      expect(service.getCurrentLessonIndex('', '')).toBe(-1);
      expect(service.getNextLesson('', '')).toBeNull();
      expect(service.getPreviousLesson('', '')).toBeNull();
      expect(service.isFirstLesson('', '')).toBe(false);
      expect(service.isLastLesson('', '')).toBe(false);
    });

    it('should handle null/undefined inputs gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      expect(service.getCurrentLessonIndex(null as any, undefined as any)).toBe(-1);
      expect(service.isValidLesson(null as any, undefined as any)).toBe(false);
    });

    it('should handle case sensitivity', () => {
      expect(service.isValidLesson('MODULE1', 'TOPIC1')).toBe(false);
      expect(service.isValidLesson('Module1', 'Topic1')).toBe(false);
    });
  });

  describe('Module Transition Logic', () => {
    it('should correctly identify module transitions in navigation', () => {
      // Last lesson of module1 to first lesson of module2
      const nextFromModule1End = service.getNextLesson('module1', 'topic5');
      expect(nextFromModule1End?.isModuleTransition).toBe(true);
      expect(nextFromModule1End?.moduleId).toBe('module2');

      // First lesson of module2 to last lesson of module1
      const prevFromModule2Start = service.getPreviousLesson('module2', 'topic6');
      expect(prevFromModule2Start?.isModuleTransition).toBe(true);
      expect(prevFromModule2Start?.moduleId).toBe('module1');

      // Within same module
      const nextWithinModule = service.getNextLesson('module1', 'topic1');
      expect(nextWithinModule?.isModuleTransition).toBe(false);
    });
  });

  describe('Lesson Sequence Integrity', () => {
    it('should have continuous global indices', () => {
      const sequence = service.getLessonSequence();
      for (let i = 0; i < sequence.length; i++) {
        expect(sequence[i].globalIndex).toBe(i);
      }
    });

    it('should have correct first/last flags', () => {
      const sequence = service.getLessonSequence();
      
      // Only first lesson should have isFirstOverall = true
      const firstOverallCount = sequence.filter(l => l.isFirstOverall).length;
      expect(firstOverallCount).toBe(1);
      expect(sequence[0].isFirstOverall).toBe(true);

      // Only last lesson should have isLastOverall = true
      const lastOverallCount = sequence.filter(l => l.isLastOverall).length;
      expect(lastOverallCount).toBe(1);
      expect(sequence[sequence.length - 1].isLastOverall).toBe(true);
    });

    it('should have correct module first/last flags', () => {
      const sequence = service.getLessonSequence();
      
      // Check module1 boundaries
      const module1Lessons = sequence.filter(l => l.moduleId === 'module1');
      expect(module1Lessons[0].isFirstInModule).toBe(true);
      expect(module1Lessons[module1Lessons.length - 1].isLastInModule).toBe(true);
      
      // Check module2 boundaries
      const module2Lessons = sequence.filter(l => l.moduleId === 'module2');
      expect(module2Lessons[0].isFirstInModule).toBe(true);
      expect(module2Lessons[module2Lessons.length - 1].isLastInModule).toBe(true);
    });
  });
});