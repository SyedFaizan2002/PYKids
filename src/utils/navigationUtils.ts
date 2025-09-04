import { navigationService, LessonNavigation, NavigationState, LessonSequence } from '../services/NavigationService';

/**
 * Calculates the global lesson index for a given lesson
 */
export function calculateGlobalLessonIndex(moduleId: string, topicId: string): number {
  return navigationService.getCurrentLessonIndex(moduleId, topicId);
}

/**
 * Gets navigation state with additional utility information
 */
export function getEnhancedNavigationState(moduleId: string, topicId: string): NavigationState & {
  currentIndex: number;
  totalLessons: number;
  progressPercentage: number;
} {
  const baseState = navigationService.getNavigationState(moduleId, topicId);
  const currentIndex = navigationService.getCurrentLessonIndex(moduleId, topicId);
  const totalLessons = navigationService.getTotalLessonCount();
  
  return {
    ...baseState,
    currentIndex,
    totalLessons,
    progressPercentage: Math.round(((currentIndex + 1) / totalLessons) * 100)
  };
}

/**
 * Generates a lesson route path
 */
export function generateLessonRoute(moduleId: string, topicId: string): string {
  return `/lesson/${moduleId}/${topicId}`;
}

/**
 * Generates the next lesson route or dashboard route
 */
export function generateNextRoute(moduleId: string, topicId: string): string {
  const nextLesson = navigationService.getNextLesson(moduleId, topicId);
  
  if (!nextLesson) {
    return '/dashboard';
  }
  
  return generateLessonRoute(nextLesson.moduleId, nextLesson.topicId);
}

/**
 * Generates the previous lesson route
 */
export function generatePreviousRoute(moduleId: string, topicId: string): string | null {
  const previousLesson = navigationService.getPreviousLesson(moduleId, topicId);
  
  if (!previousLesson) {
    return null;
  }
  
  return generateLessonRoute(previousLesson.moduleId, previousLesson.topicId);
}

/**
 * Gets lesson context information for display
 */
export function getLessonContext(moduleId: string, topicId: string): {
  lessonTitle: string;
  moduleTitle: string;
  lessonNumber: number;
  totalLessons: number;
  isFirstInModule: boolean;
  isLastInModule: boolean;
} | null {
  const lessonSequence = navigationService.getLessonSequence();
  const lessonInfo = lessonSequence.find(
    lesson => lesson.moduleId === moduleId && lesson.topicId === topicId
  );
  
  if (!lessonInfo) {
    return null;
  }
  
  return {
    lessonTitle: lessonInfo.title,
    moduleTitle: lessonInfo.moduleTitle,
    lessonNumber: lessonInfo.globalIndex + 1,
    totalLessons: navigationService.getTotalLessonCount(),
    isFirstInModule: lessonInfo.isFirstInModule,
    isLastInModule: lessonInfo.isLastInModule
  };
}

/**
 * Gets navigation button states for UI components
 */
export function getNavigationButtonStates(moduleId: string, topicId: string): {
  previousButton: {
    enabled: boolean;
    route: string | null;
    tooltip: string;
  };
  nextButton: {
    enabled: boolean;
    route: string;
    tooltip: string;
    isCompletionButton: boolean;
  };
} {
  const navState = navigationService.getNavigationState(moduleId, topicId);
  const previousRoute = generatePreviousRoute(moduleId, topicId);
  const nextRoute = generateNextRoute(moduleId, topicId);
  const nextLesson = navigationService.getNextLesson(moduleId, topicId);
  
  return {
    previousButton: {
      enabled: navState.canGoPrevious,
      route: previousRoute,
      tooltip: navState.canGoPrevious 
        ? 'Go to previous lesson' 
        : 'This is the first lesson'
    },
    nextButton: {
      enabled: navState.canGoNext || navState.nextDestination === 'dashboard',
      route: nextRoute,
      tooltip: navState.nextDestination === 'dashboard' 
        ? 'Complete course and return to dashboard'
        : nextLesson?.isModuleTransition 
          ? `Continue to next module: ${nextLesson.title}`
          : 'Go to next lesson',
      isCompletionButton: navState.nextDestination === 'dashboard'
    }
  };
}

/**
 * Validates lesson parameters
 */
export function validateLessonParams(moduleId: string, topicId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!moduleId || !topicId) {
    return {
      isValid: false,
      error: 'Module ID and Topic ID are required'
    };
  }
  
  if (!navigationService.isValidLesson(moduleId, topicId)) {
    return {
      isValid: false,
      error: `Lesson not found: ${moduleId}/${topicId}`
    };
  }
  
  return { isValid: true };
}

/**
 * Gets breadcrumb navigation data
 */
export function getBreadcrumbData(moduleId: string, topicId: string): {
  items: Array<{
    label: string;
    route: string;
    isActive: boolean;
  }>;
} {
  const lessonContext = getLessonContext(moduleId, topicId);
  
  if (!lessonContext) {
    return { items: [] };
  }
  
  return {
    items: [
      {
        label: 'Dashboard',
        route: '/dashboard',
        isActive: false
      },
      {
        label: lessonContext.moduleTitle,
        route: `/module/${moduleId}`,
        isActive: false
      },
      {
        label: lessonContext.lessonTitle,
        route: generateLessonRoute(moduleId, topicId),
        isActive: true
      }
    ]
  };
}

/**
 * Gets module progress information
 */
export function getModuleProgress(moduleId: string, completedLessons: Set<string>): {
  moduleTitle: string;
  totalLessons: number;
  completedCount: number;
  progressPercentage: number;
  lessons: Array<{
    topicId: string;
    title: string;
    completed: boolean;
    route: string;
  }>;
} | null {
  const moduleInfo = navigationService.getModuleInfo(moduleId);
  const moduleLessons = navigationService.getLessonsInModule(moduleId);
  
  if (!moduleInfo || moduleLessons.length === 0) {
    return null;
  }
  
  const completedCount = moduleLessons.filter(lesson => 
    completedLessons.has(`${lesson.moduleId}-${lesson.topicId}`)
  ).length;
  
  return {
    moduleTitle: moduleInfo.title,
    totalLessons: moduleLessons.length,
    completedCount,
    progressPercentage: Math.round((completedCount / moduleLessons.length) * 100),
    lessons: moduleLessons.map(lesson => ({
      topicId: lesson.topicId,
      title: lesson.title,
      completed: completedLessons.has(`${lesson.moduleId}-${lesson.topicId}`),
      route: generateLessonRoute(lesson.moduleId, lesson.topicId)
    }))
  };
}

/**
 * Gets overall curriculum progress
 */
export function getCurriculumProgress(completedLessons: Set<string>): {
  totalLessons: number;
  completedCount: number;
  progressPercentage: number;
  modules: Array<{
    moduleId: string;
    moduleTitle: string;
    completedCount: number;
    totalLessons: number;
    progressPercentage: number;
  }>;
} {
  const totalLessons = navigationService.getTotalLessonCount();
  
  // Count only valid lesson identifiers
  let validCompletedCount = 0;
  
  const modules = navigationService.getLessonSequence()
    .reduce((acc, lesson) => {
      const existingModule = acc.find(m => m.moduleId === lesson.moduleId);
      const lessonKey = `${lesson.moduleId}-${lesson.topicId}`;
      const isCompleted = completedLessons.has(lessonKey);
      
      // Count valid completed lessons
      if (isCompleted) {
        validCompletedCount++;
      }
      
      if (existingModule) {
        existingModule.totalLessons++;
        if (isCompleted) {
          existingModule.completedCount++;
        }
      } else {
        acc.push({
          moduleId: lesson.moduleId,
          moduleTitle: lesson.moduleTitle,
          completedCount: isCompleted ? 1 : 0,
          totalLessons: 1,
          progressPercentage: 0
        });
      }
      
      return acc;
    }, [] as Array<{
      moduleId: string;
      moduleTitle: string;
      completedCount: number;
      totalLessons: number;
      progressPercentage: number;
    }>);
  
  // Calculate percentages
  modules.forEach(module => {
    module.progressPercentage = Math.round((module.completedCount / module.totalLessons) * 100);
  });
  
  return {
    totalLessons,
    completedCount: validCompletedCount,
    progressPercentage: Math.round((validCompletedCount / totalLessons) * 100),
    modules
  };
}