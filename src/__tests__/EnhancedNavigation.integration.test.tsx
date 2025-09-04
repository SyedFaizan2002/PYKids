import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LessonPage from '../pages/LessonPage';
import QuizPage from '../pages/QuizPage';
import Dashboard from '../pages/Dashboard';
import { UserProvider } from '../contexts/UserContext';
import { navigationService } from '../services/NavigationService';
import { progressAnalyticsService } from '../services/ProgressAnalytics';

// Mock components and services
vi.mock('../services/api', () => ({
  progressAPI: {
    getUserProgress: vi.fn().mockResolvedValue({}),
    updateProgress: vi.fn().mockResolvedValue({ success: true }),
    saveQuizResult: vi.fn().mockResolvedValue({ success: true }),
  },
  analyticsAPI: {
    trackEvent: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../components/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('../components/VoiceOverPlayer', () => ({
  default: ({ text }: { text: string }) => <div data-testid="voice-over">{text}</div>,
}));

vi.mock('../components/LazyComponentWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="lazy-wrapper">{children}</div>,
}));

vi.mock('../components/LessonAnimation', () => ({
  default: ({ type }: { type: string }) => <div data-testid="lesson-animation">{type}</div>,
}));

vi.mock('../components/CodeEditor', () => ({
  default: ({ initialCode, onRun, onCodeChange }: any) => (
    <div data-testid="code-editor">
      <textarea 
        data-testid="code-input"
        defaultValue={initialCode}
        onChange={(e) => onCodeChange?.(e.target.value)}
      />
      <button 
        data-testid="run-code"
        onClick={() => onRun?.('Code executed successfully!')}
      >
        Run Code
      </button>
    </div>
  ),
}));

vi.mock('../components/CodeAnimation', () => ({
  default: () => <div data-testid="code-animation" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock user data with enhanced progress structure
const createMockUserData = (progressOverride = {}) => ({
  uid: 'test-user',
  email: 'test@example.com',
  selectedAvatar: '🧑‍💻',
  progress: {
    module1: { 
      topic1: { completed: true, score: 10 }, 
      topic2: { completed: true, score: 10 }, 
      topic3: { completed: false }, 
      topic4: { completed: false }, 
      topic5: { completed: false },
      quiz: { completed: false }
    },
    module2: { 
      topic6: { completed: false }, 
      topic7: { completed: false }, 
      topic8: { completed: false }, 
      topic9: { completed: false }, 
      topic10: { completed: false },
      quiz: { completed: false }
    },
    ...progressOverride,
  },
  totalScore: 20,
  completedLessons: 2,
  lastActiveLesson: { moduleId: 'module1', topicId: 'topic3' },
});

const MockUserProvider = ({ children, userData }: { children: React.ReactNode; userData?: any }) => {
  const mockUpdateUserProgress = vi.fn().mockResolvedValue({});
  
  vi.doMock('../contexts/UserContext', () => ({
    useUser: () => ({
      userData: userData || createMockUserData(),
      updateUserProgress: mockUpdateUserProgress,
      loading: false,
    }),
    UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }));

  return <div>{children}</div>;
};

const renderWithProviders = (component: React.ReactElement, initialEntries: string[] = ['/'], userData?: any) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <MockUserProvider userData={userData}>
        {component}
      </MockUserProvider>
    </MemoryRouter>
  );
};

describe('Enhanced Navigation and Progress Tracking Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Navigation Service', () => {
    it('should include quizzes in the content sequence', () => {
      const contentSequence = navigationService.getContentSequence();
      
      // Should have 10 lessons + 2 quizzes = 12 total content items
      expect(contentSequence).toHaveLength(12);
      
      // Verify the sequence order
      expect(contentSequence[0]).toEqual(expect.objectContaining({
        moduleId: 'module1',
        topicId: 'topic1',
        type: 'lesson',
        globalIndex: 0
      }));
      
      expect(contentSequence[4]).toEqual(expect.objectContaining({
        moduleId: 'module1',
        topicId: 'topic5',
        type: 'lesson',
        globalIndex: 4
      }));
      
      expect(contentSequence[5]).toEqual(expect.objectContaining({
        moduleId: 'module1',
        topicId: 'quiz',
        type: 'quiz',
        globalIndex: 5
      }));
      
      expect(contentSequence[6]).toEqual(expect.objectContaining({
        moduleId: 'module2',
        topicId: 'topic6',
        type: 'lesson',
        globalIndex: 6
      }));
      
      expect(contentSequence[11]).toEqual(expect.objectContaining({
        moduleId: 'module2',
        topicId: 'quiz',
        type: 'quiz',
        globalIndex: 11,
        isLastOverall: true
      }));
    });

    it('should correctly navigate from lesson to quiz', () => {
      // Test navigation from last lesson of module1 to module1 quiz
      const nextContent = navigationService.getNextContent('module1', 'topic5');
      
      expect(nextContent).toEqual({
        moduleId: 'module1',
        topicId: 'quiz',
        title: 'Introduction to Python (Basics) Quiz',
        type: 'quiz',
        isModuleTransition: false
      });
    });

    it('should correctly navigate from quiz to next module', () => {
      // Test navigation from module1 quiz to first lesson of module2
      const nextContent = navigationService.getNextContent('module1', 'quiz');
      
      expect(nextContent).toEqual({
        moduleId: 'module2',
        topicId: 'topic6',
        title: 'Strings in Python',
        type: 'lesson',
        isModuleTransition: true
      });
    });

    it('should correctly handle final quiz navigation', () => {
      // Test navigation from final quiz should return null
      const nextContent = navigationService.getNextContent('module2', 'quiz');
      expect(nextContent).toBe(null);
      
      // Navigation state should indicate dashboard destination
      const navigationState = navigationService.getNavigationState('module2', 'quiz');
      expect(navigationState.nextDestination).toBe('dashboard');
      expect(navigationState.canGoNext).toBe(false);
    });

    it('should generate correct routes for content items', () => {
      expect(navigationService.getContentRoute('module1', 'topic1')).toBe('/lesson/module1/topic1');
      expect(navigationService.getContentRoute('module1', 'quiz')).toBe('/quiz/module1');
      expect(navigationService.getContentRoute('module2', 'topic10')).toBe('/lesson/module2/topic10');
      expect(navigationService.getContentRoute('module2', 'quiz')).toBe('/quiz/module2');
    });
  });

  describe('Enhanced Progress Analytics', () => {
    it('should calculate progress including quizzes', () => {
      const userData = createMockUserData({
        module1: { 
          topic1: { completed: true, score: 10 }, 
          topic2: { completed: true, score: 10 }, 
          topic3: { completed: true, score: 10 }, 
          topic4: { completed: false }, 
          topic5: { completed: false },
          quiz: { completed: true, score: 85 }
        },
      });

      const analytics = progressAnalyticsService.calculateProgressAnalytics(userData);
      
      expect(analytics.totalLessons).toBe(10);
      expect(analytics.totalQuizzes).toBe(2);
      expect(analytics.totalContent).toBe(12);
      expect(analytics.completedLessons).toBe(3);
      expect(analytics.completedQuizzes).toBe(1);
      expect(analytics.completedContent).toBe(4);
      expect(analytics.completionPercentage).toBe(30); // 3/10 lessons
      expect(analytics.contentCompletionPercentage).toBe(33); // 4/12 total content
    });

    it('should identify last active quiz correctly', () => {
      const userData = createMockUserData();
      userData.lastActiveLesson = { moduleId: 'module1', topicId: 'quiz' };

      const analytics = progressAnalyticsService.calculateProgressAnalytics(userData);
      
      expect(analytics.lastActiveContent).toEqual({
        moduleId: 'module1',
        topicId: 'quiz',
        title: 'Introduction to Python (Basics) Quiz',
        moduleName: 'Introduction to Python (Basics)',
        type: 'quiz'
      });
    });

    it('should calculate module progress including quizzes', () => {
      const userData = createMockUserData({
        module1: { 
          topic1: { completed: true, score: 10 }, 
          topic2: { completed: true, score: 10 }, 
          topic3: { completed: true, score: 10 }, 
          topic4: { completed: true, score: 10 }, 
          topic5: { completed: true, score: 10 },
          quiz: { completed: true, score: 90 }
        },
        module2: { 
          topic6: { completed: true, score: 10 }, 
          topic7: { completed: false }, 
          topic8: { completed: false }, 
          topic9: { completed: false }, 
          topic10: { completed: false },
          quiz: { completed: false }
        },
      });

      const analytics = progressAnalyticsService.calculateProgressAnalytics(userData);
      const moduleProgress = analytics.moduleProgress;
      
      expect(moduleProgress[0]).toEqual({
        moduleId: 'module1',
        moduleName: 'Introduction to Python (Basics)',
        totalLessons: 5,
        completedLessons: 5,
        hasQuiz: true,
        quizCompleted: true,
        totalContent: 6,
        completedContent: 6,
        percentage: 100
      });
      
      expect(moduleProgress[1]).toEqual({
        moduleId: 'module2',
        moduleName: 'Python Operations & Control Flow',
        totalLessons: 5,
        completedLessons: 1,
        hasQuiz: true,
        quizCompleted: false,
        totalContent: 6,
        completedContent: 1,
        percentage: 17 // 1/6 rounded
      });
    });
  });

  describe('Lesson to Quiz Navigation', () => {
    it('should show "Take Quiz" button after completing last lesson of module', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic5']
      );

      await waitFor(() => {
        expect(screen.getByText('Data Types in Python')).toBeInTheDocument();
      });

      // Should show "Take Quiz" as next button
      const nextButton = screen.getByText('Take Quiz');
      expect(nextButton).toBeInTheDocument();
    });

    it('should navigate to quiz after completing last lesson', async () => {
      const mockUpdateUserProgress = vi.fn().mockResolvedValue({});
      
      vi.doMock('../contexts/UserContext', () => ({
        useUser: () => ({
          userData: createMockUserData(),
          updateUserProgress: mockUpdateUserProgress,
          loading: false,
        }),
      }));

      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic5']
      );

      await waitFor(() => {
        expect(screen.getByText('Data Types in Python')).toBeInTheDocument();
      });

      // Complete the lesson
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      // Should update progress and navigate to quiz
      await waitFor(() => {
        expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'topic5', true, 10);
      }, { timeout: 2000 });
    });
  });

  describe('Quiz Navigation', () => {
    it('should show navigation buttons on quiz page', async () => {
      const { container } = renderWithProviders(
        <QuizPage />, 
        ['/quiz/module1']
      );

      await waitFor(() => {
        expect(screen.getByText('Module Quiz 🧠')).toBeInTheDocument();
      });

      // Should show previous and next buttons
      expect(screen.getByText('Previous Lesson')).toBeInTheDocument();
      expect(screen.getByText('Next Lesson')).toBeInTheDocument();
    });

    it('should navigate correctly from quiz completion', async () => {
      const { container } = renderWithProviders(
        <QuizPage />, 
        ['/quiz/module1']
      );

      await waitFor(() => {
        expect(screen.getByText('Module Quiz 🧠')).toBeInTheDocument();
      });

      // Answer all questions correctly
      const questions = screen.getAllByRole('button');
      const correctAnswers = questions.filter(btn => 
        btn.textContent?.includes('Giving step-by-step instructions to computers') ||
        btn.textContent?.includes('It\'s easy to read and learn, almost like English') ||
        btn.textContent?.includes('my_age') ||
        btn.textContent?.includes('String') ||
        btn.textContent?.includes('Shows \'Hi there!\' on the screen')
      );

      // Click through quiz
      for (let i = 0; i < correctAnswers.length; i++) {
        if (correctAnswers[i]) {
          fireEvent.click(correctAnswers[i]);
          
          await waitFor(() => {
            const nextButton = screen.queryByText('Next Question') || screen.queryByText('Finish Quiz');
            if (nextButton) {
              fireEvent.click(nextButton);
            }
          });
        }
      }

      // Should show completion screen
      await waitFor(() => {
        expect(screen.getByText(/Amazing!|Good Job!|Keep Learning!/)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Progress Display', () => {
    it('should display enhanced progress information', async () => {
      const userData = createMockUserData({
        module1: { 
          topic1: { completed: true, score: 10 }, 
          topic2: { completed: true, score: 10 }, 
          topic3: { completed: true, score: 10 }, 
          topic4: { completed: false }, 
          topic5: { completed: false },
          quiz: { completed: true, score: 85 }
        },
      });

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Should show lessons completed
      expect(screen.getByText('3 of 10')).toBeInTheDocument(); // lessons
      
      // Should show quizzes completed
      expect(screen.getByText('1 of 2')).toBeInTheDocument(); // quizzes
      
      // Should show overall progress
      expect(screen.getByText('4 of 12')).toBeInTheDocument(); // total content
    });

    it('should show quiz completion status in module cards', async () => {
      const userData = createMockUserData({
        module1: { 
          topic1: { completed: true, score: 10 }, 
          topic2: { completed: true, score: 10 }, 
          topic3: { completed: true, score: 10 }, 
          topic4: { completed: true, score: 10 }, 
          topic5: { completed: true, score: 10 },
          quiz: { completed: true, score: 90 }
        },
      });

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Should show completed quiz with score
      expect(screen.getByText('Completed! Score: 90%')).toBeInTheDocument();
      expect(screen.getByText('Retake Quiz')).toBeInTheDocument();
    });

    it('should show resume section for quiz', async () => {
      const userData = createMockUserData();
      userData.lastActiveLesson = { moduleId: 'module1', topicId: 'quiz' };

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData
      );

      await waitFor(() => {
        expect(screen.getByText('Continue Where You Left Off')).toBeInTheDocument();
      });

      // Should show quiz as last active
      expect(screen.getByText('Introduction to Python (Basics) Quiz')).toBeInTheDocument();
      expect(screen.getByText('🧠 Quiz')).toBeInTheDocument();
      expect(screen.getByText('Resume Quiz')).toBeInTheDocument();
    });
  });

  describe('Complete Flow Integration', () => {
    it('should handle complete flow from lesson to quiz to next module', async () => {
      // This test would simulate the complete user journey
      // Due to the complexity of testing navigation between pages in this setup,
      // we'll verify the navigation service logic instead
      
      const contentSequence = navigationService.getContentSequence();
      
      // Verify complete flow sequence
      const expectedFlow = [
        { moduleId: 'module1', topicId: 'topic1', type: 'lesson' },
        { moduleId: 'module1', topicId: 'topic2', type: 'lesson' },
        { moduleId: 'module1', topicId: 'topic3', type: 'lesson' },
        { moduleId: 'module1', topicId: 'topic4', type: 'lesson' },
        { moduleId: 'module1', topicId: 'topic5', type: 'lesson' },
        { moduleId: 'module1', topicId: 'quiz', type: 'quiz' },
        { moduleId: 'module2', topicId: 'topic6', type: 'lesson' },
        { moduleId: 'module2', topicId: 'topic7', type: 'lesson' },
        { moduleId: 'module2', topicId: 'topic8', type: 'lesson' },
        { moduleId: 'module2', topicId: 'topic9', type: 'lesson' },
        { moduleId: 'module2', topicId: 'topic10', type: 'lesson' },
        { moduleId: 'module2', topicId: 'quiz', type: 'quiz' },
      ];

      expectedFlow.forEach((expected, index) => {
        expect(contentSequence[index]).toEqual(expect.objectContaining(expected));
      });

      // Verify navigation between each step
      for (let i = 0; i < expectedFlow.length - 1; i++) {
        const current = expectedFlow[i];
        const next = expectedFlow[i + 1];
        
        const nextContent = navigationService.getNextContent(current.moduleId, current.topicId);
        expect(nextContent).toEqual(expect.objectContaining({
          moduleId: next.moduleId,
          topicId: next.topicId,
          type: next.type
        }));
      }
    });
  });
});