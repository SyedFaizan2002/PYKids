/**
 * Example usage of NavigationService and navigation utilities
 * This file demonstrates how to use the navigation system in the PyKIDS application
 */

import { navigationService } from '../services/NavigationService';
import {
  getEnhancedNavigationState,
  getNavigationButtonStates,
  getLessonContext,
  getCurriculumProgress
} from '../utils/navigationUtils';

// Example 1: Basic navigation operations
console.log('=== Basic Navigation Operations ===');

// Get current lesson index
const currentIndex = navigationService.getCurrentLessonIndex('module1', 'topic1');
console.log('Current lesson index:', currentIndex); // 0

// Get next lesson
const nextLesson = navigationService.getNextLesson('module1', 'topic1');
console.log('Next lesson:', nextLesson);
// { moduleId: 'module1', topicId: 'topic2', title: 'What is Python?', isModuleTransition: false }

// Get navigation state
const navState = navigationService.getNavigationState('module1', 'topic1');
console.log('Navigation state:', navState);
// { canGoNext: true, canGoPrevious: false, nextDestination: 'lesson', previousAvailable: false }

// Example 2: Enhanced navigation state with progress
console.log('\n=== Enhanced Navigation State ===');

const enhancedState = getEnhancedNavigationState('module1', 'topic3');
console.log('Enhanced state:', enhancedState);
// Includes currentIndex, totalLessons, progressPercentage

// Example 3: Navigation button states for UI
console.log('\n=== Navigation Button States ===');

const buttonStates = getNavigationButtonStates('module1', 'topic5');
console.log('Button states for module transition:', buttonStates);
// Shows tooltip for module transition

// Example 4: Lesson context information
console.log('\n=== Lesson Context ===');

const lessonContext = getLessonContext('module2', 'topic6');
console.log('Lesson context:', lessonContext);
// { lessonTitle: 'Strings in Python', moduleTitle: 'Python Operations & Control Flow', ... }

// Example 5: Progress tracking
console.log('\n=== Progress Tracking ===');

// Simulate completed lessons
const completedLessons = new Set([
  'module1-topic1',
  'module1-topic2',
  'module1-topic3',
  'module2-topic6'
]);

const curriculumProgress = getCurriculumProgress(completedLessons);
console.log('Overall progress:', curriculumProgress);
// Shows total progress and per-module breakdown

// Example 6: Edge cases and validation
console.log('\n=== Edge Cases and Validation ===');

// Check if lesson exists
const isValid = navigationService.isValidLesson('module1', 'topic1');
console.log('Is valid lesson:', isValid); // true

const isInvalid = navigationService.isValidLesson('invalid', 'topic1');
console.log('Is invalid lesson:', isInvalid); // false

// Handle last lesson
const lastLessonNext = navigationService.getNextLesson('module2', 'topic10');
console.log('Next from last lesson:', lastLessonNext); // null

// Example 7: Module information
console.log('\n=== Module Information ===');

const moduleInfo = navigationService.getModuleInfo('module1');
console.log('Module info:', moduleInfo?.title); // 'Introduction to Python (Basics)'

const moduleLessons = navigationService.getLessonsInModule('module1');
console.log('Module1 lesson count:', moduleLessons.length); // 5

// Example 8: Complete lesson sequence
console.log('\n=== Complete Lesson Sequence ===');

const fullSequence = navigationService.getLessonSequence();
console.log('Total lessons:', fullSequence.length); // 10
console.log('First lesson:', fullSequence[0].title); // 'What is Programming?'
console.log('Last lesson:', fullSequence[9].title); // 'Loops in Python'

// Example 9: Progress percentage calculation
console.log('\n=== Progress Percentage ===');

const progressPercentage = navigationService.getProgressPercentage(7);
console.log('Progress for 7 completed lessons:', progressPercentage + '%'); // 70%

export default {
  navigationService,
  getEnhancedNavigationState,
  getNavigationButtonStates,
  getLessonContext,
  getCurriculumProgress
};