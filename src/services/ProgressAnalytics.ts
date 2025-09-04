import { curriculum, Module, Lesson } from '../data/curriculum';
import { UserData } from '../contexts/UserContext';
import { navigationService } from './NavigationService';

export interface ProgressAnalytics {
  totalLessons: number;
  totalQuizzes: number;
  totalContent: number;
  completedLessons: number;
  completedQuizzes: number;
  completedContent: number;
  completionPercentage: number;
  contentCompletionPercentage: number;
  lastActiveContent: {
    moduleId: string;
    topicId: string;
    title: string;
    moduleName: string;
    type: 'lesson' | 'quiz';
  } | null;
  moduleProgress: ModuleProgress[];
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  totalLessons: number;
  completedLessons: number;
  hasQuiz: boolean;
  quizCompleted: boolean;
  totalContent: number;
  completedContent: number;
  percentage: number;
}

export interface DetailedProgress {
  lessonId: string;
  moduleId: string;
  topicId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'reviewed';
  score: number;
  timeSpent: number;
  completedAt?: string;
  lastAccessedAt: string;
  attempts: number;
}

export interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  averageScore: number;
  totalTimeSpent: number;
  streakDays: number;
  lastActiveDate: string;
}

export class ProgressAnalyticsService {
  private static instance: ProgressAnalyticsService;

  private constructor() {}

  public static getInstance(): ProgressAnalyticsService {
    if (!ProgressAnalyticsService.instance) {
      ProgressAnalyticsService.instance = new ProgressAnalyticsService();
    }
    return ProgressAnalyticsService.instance;
  }

  /**
   * Calculates comprehensive progress analytics from user data
   */
  public calculateProgressAnalytics(userData: UserData): ProgressAnalytics {
    const totalLessons = navigationService.getTotalLessonCount();
    const totalQuizzes = curriculum.length; // One quiz per module
    const totalContent = navigationService.getTotalContentCount();
    
    const completedLessons = this.getCompletedLessonsCount(userData.progress);
    const completedQuizzes = this.getCompletedQuizzesCount(userData.progress);
    const completedContent = completedLessons + completedQuizzes;
    
    const completionPercentage = this.calculateCompletionPercentage(completedLessons, totalLessons);
    const contentCompletionPercentage = this.calculateCompletionPercentage(completedContent, totalContent);
    
    const moduleProgress = this.calculateModuleProgress(userData.progress);
    const lastActiveContent = this.getLastActiveContentInfo(userData.lastActiveLesson);

    return {
      totalLessons,
      totalQuizzes,
      totalContent,
      completedLessons,
      completedQuizzes,
      completedContent,
      completionPercentage,
      contentCompletionPercentage,
      lastActiveContent,
      moduleProgress
    };
  }

  /**
   * Counts the total number of completed lessons across all modules
   */
  public getCompletedLessonsCount(progress: UserData['progress']): number {
    let completedCount = 0;
    
    Object.keys(progress).forEach(moduleId => {
      Object.keys(progress[moduleId]).forEach(topicId => {
        // Only count actual lessons, not quizzes
        if (topicId !== 'quiz' && progress[moduleId][topicId]?.completed) {
          completedCount++;
        }
      });
    });

    return completedCount;
  }

  /**
   * Counts the total number of completed quizzes across all modules
   */
  public getCompletedQuizzesCount(progress: UserData['progress']): number {
    let completedCount = 0;
    
    Object.keys(progress).forEach(moduleId => {
      if (progress[moduleId]['quiz']?.completed) {
        completedCount++;
      }
    });

    return completedCount;
  }

  /**
   * Calculates completion percentage with proper rounding
   */
  public calculateCompletionPercentage(completedLessons: number, totalLessons: number): number {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons / totalLessons) * 100);
  }

  /**
   * Calculates progress for each module individually
   */
  public calculateModuleProgress(progress: UserData['progress']): ModuleProgress[] {
    return curriculum.map(module => {
      const moduleProgress = progress[module.id] || {};
      const totalLessons = module.lessons.length;
      const completedLessons = module.lessons.filter(lesson => 
        moduleProgress[lesson.id]?.completed || false
      ).length;
      
      const hasQuiz = true; // All modules have quizzes
      const quizCompleted = moduleProgress['quiz']?.completed || false;
      
      const totalContent = totalLessons + (hasQuiz ? 1 : 0);
      const completedContent = completedLessons + (quizCompleted ? 1 : 0);
      
      const percentage = this.calculateCompletionPercentage(completedContent, totalContent);

      return {
        moduleId: module.id,
        moduleName: module.title,
        totalLessons,
        completedLessons,
        hasQuiz,
        quizCompleted,
        totalContent,
        completedContent,
        percentage
      };
    });
  }

  /**
   * Gets detailed information about the last active content (lesson or quiz)
   */
  public getLastActiveContentInfo(lastActiveLesson: UserData['lastActiveLesson']): ProgressAnalytics['lastActiveContent'] {
    if (!lastActiveLesson) {
      return null;
    }

    const { moduleId, topicId } = lastActiveLesson;
    const module = navigationService.getModuleInfo(moduleId);

    if (!module) {
      return null;
    }

    if (topicId === 'quiz') {
      return {
        moduleId,
        topicId,
        title: `${module.title} Quiz`,
        moduleName: module.title,
        type: 'quiz'
      };
    }

    const lesson = navigationService.getLessonInfo(moduleId, topicId);
    if (!lesson) {
      return null;
    }

    return {
      moduleId,
      topicId,
      title: lesson.title,
      moduleName: module.title,
      type: 'lesson'
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  public getLastActiveLessonInfo(lastActiveLesson: UserData['lastActiveLesson']): ProgressAnalytics['lastActiveContent'] {
    return this.getLastActiveContentInfo(lastActiveLesson);
  }

  /**
   * Determines if there's a lesson to resume
   */
  public hasResumableLesson(userData: UserData): boolean {
    return userData.lastActiveLesson !== null && userData.lastActiveLesson !== undefined;
  }

  /**
   * Gets the next recommended content (lesson or quiz) for the user
   */
  public getNextRecommendedContent(userData: UserData): { moduleId: string; topicId: string; type: 'lesson' | 'quiz' } | null {
    // If user has a last active content, recommend continuing from there
    if (userData.lastActiveLesson) {
      const { moduleId, topicId } = userData.lastActiveLesson;
      
      // Check if current content is completed, if so get next content
      if (userData.progress[moduleId]?.[topicId]?.completed) {
        const nextContent = navigationService.getNextContent(moduleId, topicId);
        if (nextContent) {
          return {
            moduleId: nextContent.moduleId,
            topicId: nextContent.topicId,
            type: nextContent.type
          };
        }
      } else {
        // Continue with current content
        return {
          moduleId,
          topicId,
          type: topicId === 'quiz' ? 'quiz' : 'lesson'
        };
      }
    }

    // Find first incomplete content using navigation service
    const contentSequence = navigationService.getContentSequence();
    for (const content of contentSequence) {
      if (!userData.progress[content.moduleId]?.[content.topicId]?.completed) {
        return {
          moduleId: content.moduleId,
          topicId: content.topicId,
          type: content.type
        };
      }
    }

    return null;
  }

  /**
   * Legacy method for backward compatibility
   */
  public getNextRecommendedLesson(userData: UserData): { moduleId: string; topicId: string } | null {
    const nextContent = this.getNextRecommendedContent(userData);
    if (nextContent) {
      return {
        moduleId: nextContent.moduleId,
        topicId: nextContent.topicId
      };
    }
    return null;
  }

  /**
   * Calculates average score across completed lessons
   */
  public calculateAverageScore(progress: UserData['progress']): number {
    let totalScore = 0;
    let completedCount = 0;

    Object.keys(progress).forEach(moduleId => {
      Object.keys(progress[moduleId]).forEach(topicId => {
        const lessonProgress = progress[moduleId][topicId];
        if (lessonProgress.completed && lessonProgress.score !== undefined) {
          totalScore += lessonProgress.score;
          completedCount++;
        }
      });
    });

    return completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
  }

  /**
   * Gets progress summary with additional metrics
   */
  public getProgressSummary(userData: UserData): ProgressSummary {
    const analytics = this.calculateProgressAnalytics(userData);
    const averageScore = this.calculateAverageScore(userData.progress);
    
    return {
      totalLessons: analytics.totalLessons,
      completedLessons: analytics.completedLessons,
      inProgressLessons: this.getInProgressLessonsCount(userData.progress),
      averageScore,
      totalTimeSpent: 0, // TODO: Implement when time tracking is added
      streakDays: 0, // TODO: Implement when streak tracking is added
      lastActiveDate: this.getLastActiveDate(userData.progress)
    };
  }

  /**
   * Counts lessons that are started but not completed
   */
  private getInProgressLessonsCount(progress: UserData['progress']): number {
    let inProgressCount = 0;
    
    Object.keys(progress).forEach(moduleId => {
      Object.keys(progress[moduleId]).forEach(topicId => {
        const lessonProgress = progress[moduleId][topicId];
        if (!lessonProgress.completed && lessonProgress.score !== undefined && lessonProgress.score > 0) {
          inProgressCount++;
        }
      });
    });

    return inProgressCount;
  }

  /**
   * Gets the most recent completion date
   */
  private getLastActiveDate(progress: UserData['progress']): string {
    let latestDate = '';
    
    Object.keys(progress).forEach(moduleId => {
      Object.keys(progress[moduleId]).forEach(topicId => {
        const lessonProgress = progress[moduleId][topicId];
        if (lessonProgress.completedAt && lessonProgress.completedAt > latestDate) {
          latestDate = lessonProgress.completedAt;
        }
      });
    });

    return latestDate;
  }

  /**
   * Checks if a specific lesson is completed
   */
  public isLessonCompleted(progress: UserData['progress'], moduleId: string, topicId: string): boolean {
    return progress[moduleId]?.[topicId]?.completed || false;
  }

  /**
   * Gets completion status for a specific module
   */
  public getModuleCompletionStatus(progress: UserData['progress'], moduleId: string): {
    isCompleted: boolean;
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  } {
    const module = curriculum.find(m => m.id === moduleId);
    if (!module) {
      return { isCompleted: false, completedLessons: 0, totalLessons: 0, percentage: 0 };
    }

    const moduleProgress = progress[moduleId] || {};
    const completedLessons = module.lessons.filter(lesson => 
      moduleProgress[lesson.id]?.completed || false
    ).length;
    const totalLessons = module.lessons.length;
    const percentage = this.calculateCompletionPercentage(completedLessons, totalLessons);
    const isCompleted = completedLessons === totalLessons;

    return {
      isCompleted,
      completedLessons,
      totalLessons,
      percentage
    };
  }

  /**
   * Validates progress data integrity
   */
  public validateProgressData(progress: UserData['progress']): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for invalid module IDs
    Object.keys(progress).forEach(moduleId => {
      const module = curriculum.find(m => m.id === moduleId);
      if (!module) {
        errors.push(`Invalid module ID: ${moduleId}`);
        return;
      }

      // Check for invalid lesson IDs within valid modules
      Object.keys(progress[moduleId]).forEach(topicId => {
        const lesson = module.lessons.find(l => l.id === topicId);
        if (!lesson) {
          errors.push(`Invalid lesson ID: ${topicId} in module ${moduleId}`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const progressAnalyticsService = ProgressAnalyticsService.getInstance();