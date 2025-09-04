import { curriculum, Module, Lesson } from '../data/curriculum';

export interface LessonNavigation {
  moduleId: string;
  topicId: string;
  title: string;
  isModuleTransition: boolean;
  type: 'lesson' | 'quiz';
}

export interface NavigationState {
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextDestination: 'lesson' | 'quiz' | 'dashboard';
  previousAvailable: boolean;
}

export interface ContentItem {
  globalIndex: number;
  moduleId: string;
  topicId: string;
  title: string;
  moduleTitle: string;
  type: 'lesson' | 'quiz';
  isFirstInModule: boolean;
  isLastInModule: boolean;
  isFirstOverall: boolean;
  isLastOverall: boolean;
}

// Legacy interface for backward compatibility
export interface LessonSequence extends ContentItem {}

export class NavigationService {
  private static instance: NavigationService;
  private contentSequence: ContentItem[] = [];

  private constructor() {
    this.buildContentSequence();
  }

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Builds a flat sequence of all lessons and quizzes across all modules
   * Flow: Module1 Lessons (1-5) → Module1 Quiz → Module2 Lessons (6-10) → Module2 Quiz
   */
  private buildContentSequence(): void {
    this.contentSequence = [];
    let globalIndex = 0;

    curriculum.forEach((module: Module, moduleIndex: number) => {
      // Add all lessons in the module
      module.lessons.forEach((lesson: Lesson, lessonIndex: number) => {
        this.contentSequence.push({
          globalIndex,
          moduleId: module.id,
          topicId: lesson.id,
          title: lesson.title,
          moduleTitle: module.title,
          type: 'lesson',
          isFirstInModule: lessonIndex === 0,
          isLastInModule: false, // Will be updated after adding quiz
          isFirstOverall: globalIndex === 0,
          isLastOverall: false // Will be updated at the end
        });
        globalIndex++;
      });

      // Add quiz after all lessons in the module
      this.contentSequence.push({
        globalIndex,
        moduleId: module.id,
        topicId: 'quiz',
        title: `${module.title} Quiz`,
        moduleTitle: module.title,
        type: 'quiz',
        isFirstInModule: false,
        isLastInModule: true,
        isFirstOverall: false,
        isLastOverall: false // Will be updated at the end
      });
      globalIndex++;
    });

    // Update isLastOverall for the final item
    if (this.contentSequence.length > 0) {
      this.contentSequence[this.contentSequence.length - 1].isLastOverall = true;
    }
  }

  /**
   * Gets the total number of lessons across all modules
   */
  public getTotalLessonCount(): number {
    return curriculum.reduce((total, module) => total + module.lessons.length, 0);
  }

  /**
   * Gets the total number of content items (lessons + quizzes)
   */
  public getTotalContentCount(): number {
    return this.contentSequence.length;
  }

  /**
   * Gets the current content item's global index (0-based)
   */
  public getCurrentContentIndex(moduleId: string, topicId: string): number {
    const contentInfo = this.contentSequence.find(
      item => item.moduleId === moduleId && item.topicId === topicId
    );
    return contentInfo ? contentInfo.globalIndex : -1;
  }

  /**
   * Legacy method for backward compatibility
   */
  public getCurrentLessonIndex(moduleId: string, topicId: string): number {
    return this.getCurrentContentIndex(moduleId, topicId);
  }

  /**
   * Gets the next content item (lesson or quiz) in the sequence
   */
  public getNextContent(moduleId: string, topicId: string): LessonNavigation | null {
    const currentIndex = this.getCurrentContentIndex(moduleId, topicId);
    if (currentIndex === -1 || currentIndex >= this.contentSequence.length - 1) {
      return null;
    }

    const nextContent = this.contentSequence[currentIndex + 1];
    const currentContent = this.contentSequence[currentIndex];
    
    return {
      moduleId: nextContent.moduleId,
      topicId: nextContent.topicId,
      title: nextContent.title,
      type: nextContent.type,
      isModuleTransition: currentContent.moduleId !== nextContent.moduleId
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  public getNextLesson(moduleId: string, topicId: string): LessonNavigation | null {
    return this.getNextContent(moduleId, topicId);
  }

  /**
   * Gets the previous content item (lesson or quiz) in the sequence
   */
  public getPreviousContent(moduleId: string, topicId: string): LessonNavigation | null {
    const currentIndex = this.getCurrentContentIndex(moduleId, topicId);
    if (currentIndex <= 0) {
      return null;
    }

    const previousContent = this.contentSequence[currentIndex - 1];
    const currentContent = this.contentSequence[currentIndex];
    
    return {
      moduleId: previousContent.moduleId,
      topicId: previousContent.topicId,
      title: previousContent.title,
      type: previousContent.type,
      isModuleTransition: currentContent.moduleId !== previousContent.moduleId
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  public getPreviousLesson(moduleId: string, topicId: string): LessonNavigation | null {
    return this.getPreviousContent(moduleId, topicId);
  }

  /**
   * Checks if the current content item is the first overall
   */
  public isFirstContent(moduleId: string, topicId: string): boolean {
    const contentInfo = this.contentSequence.find(
      item => item.moduleId === moduleId && item.topicId === topicId
    );
    return contentInfo ? contentInfo.isFirstOverall : false;
  }

  /**
   * Legacy method for backward compatibility
   */
  public isFirstLesson(moduleId: string, topicId: string): boolean {
    return this.isFirstContent(moduleId, topicId);
  }

  /**
   * Checks if the current content item is the last overall
   */
  public isLastContent(moduleId: string, topicId: string): boolean {
    const contentInfo = this.contentSequence.find(
      item => item.moduleId === moduleId && item.topicId === topicId
    );
    return contentInfo ? contentInfo.isLastOverall : false;
  }

  /**
   * Legacy method for backward compatibility
   */
  public isLastLesson(moduleId: string, topicId: string): boolean {
    return this.isLastContent(moduleId, topicId);
  }

  /**
   * Gets the complete navigation state for a content item (lesson or quiz)
   */
  public getNavigationState(moduleId: string, topicId: string): NavigationState {
    const isFirst = this.isFirstContent(moduleId, topicId);
    const isLast = this.isLastContent(moduleId, topicId);
    const nextContent = this.getNextContent(moduleId, topicId);

    let nextDestination: 'lesson' | 'quiz' | 'dashboard' = 'dashboard';
    if (!isLast && nextContent) {
      nextDestination = nextContent.type;
    }

    return {
      canGoNext: !isLast,
      canGoPrevious: !isFirst,
      nextDestination,
      previousAvailable: !isFirst
    };
  }

  /**
   * Gets content item by global index
   */
  public getContentByIndex(index: number): ContentItem | null {
    if (index < 0 || index >= this.contentSequence.length) {
      return null;
    }
    return this.contentSequence[index];
  }

  /**
   * Legacy method for backward compatibility
   */
  public getLessonByIndex(index: number): LessonSequence | null {
    return this.getContentByIndex(index);
  }

  /**
   * Gets all content items in a specific module
   */
  public getContentInModule(moduleId: string): ContentItem[] {
    return this.contentSequence.filter(item => item.moduleId === moduleId);
  }

  /**
   * Legacy method for backward compatibility
   */
  public getLessonsInModule(moduleId: string): LessonSequence[] {
    return this.getContentInModule(moduleId);
  }

  /**
   * Gets the module information for a given module
   */
  public getModuleInfo(moduleId: string): Module | null {
    return curriculum.find(module => module.id === moduleId) || null;
  }

  /**
   * Gets the lesson information for a given lesson
   */
  public getLessonInfo(moduleId: string, topicId: string): Lesson | null {
    const module = this.getModuleInfo(moduleId);
    if (!module || topicId === 'quiz') return null;
    
    return module.lessons.find(lesson => lesson.id === topicId) || null;
  }

  /**
   * Gets the complete content sequence for debugging/testing
   */
  public getContentSequence(): ContentItem[] {
    return [...this.contentSequence];
  }

  /**
   * Legacy method for backward compatibility
   */
  public getLessonSequence(): LessonSequence[] {
    return this.getContentSequence();
  }

  /**
   * Validates if a content item exists
   */
  public isValidContent(moduleId: string, topicId: string): boolean {
    return this.getCurrentContentIndex(moduleId, topicId) !== -1;
  }

  /**
   * Legacy method for backward compatibility
   */
  public isValidLesson(moduleId: string, topicId: string): boolean {
    return this.isValidContent(moduleId, topicId);
  }

  /**
   * Gets the progress through the curriculum as a percentage (lessons only)
   */
  public getProgressPercentage(completedLessons: number): number {
    const totalLessons = this.getTotalLessonCount();
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons / totalLessons) * 100);
  }

  /**
   * Gets the progress through all content (lessons + quizzes) as a percentage
   */
  public getContentProgressPercentage(completedContent: number): number {
    const totalContent = this.getTotalContentCount();
    if (totalContent === 0) return 0;
    return Math.round((completedContent / totalContent) * 100);
  }

  /**
   * Gets the route path for a content item
   */
  public getContentRoute(moduleId: string, topicId: string): string {
    if (topicId === 'quiz') {
      return `/quiz/${moduleId}`;
    }
    return `/lesson/${moduleId}/${topicId}`;
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();