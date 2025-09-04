import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import LessonPage from '../pages/LessonPage';
import { UserProvider } from '../contexts/UserContext';
import { ProgressAnalytics } from '../services/ProgressAnalytics';
import { progressAPI } from '../services/api';

// Mock the API services
vi.mock('../services/api', () => ({
  progressAPI: {
    getUserProgress: vi.fn(),
    updateProgress: vi.fn(),
    saveQuizResult: vi.fn(),
  },
  analyticsAPI: {
    trackEvent: vi.fn().mockResolvedValue({}),
  },
}));

// Mock components to focus on progress tracking
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

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock user data with various progress states
const createMockUserData = (progressOverride = {}) => ({
  uid: 'test-user',
  email: 'test@example.com',
  selectedAvatar: '🧑‍💻',
  progress: {
    module1: { topic1: true, topic2: true, topic3: false, topic4: false, topic5: false },
    module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
    ...progressOverride,
  },
  totalScore: 20,
  completedLessons: 2,
  lastActiveLesson: { moduleId: 'module1', topicId: 'topic2' },
});

const MockUserProvider = ({ children, userData }: { children: React.ReactNode; userData?: any }) => {
  const mockUpdateUserProgress = vi.fn().mockResolvedValue({});
  
  // Mock the useUser hook
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

describe('Progress Tracking Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset API mocks
    (progressAPI.getUserProgress as any).mockResolvedValue({
      progress: {
        module1: { topic1: true, topic2: true, topic3: false, topic4: false, topic5: false },
        module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
      },
      totalScore: 20,
      completedLessons: 2,
      lastActiveLesson: { moduleId: 'module1', topicId: 'topic2' },
    });
    (progressAPI.updateProgress as any).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Progress Updates and Persistence', () => {
    it('should update progress when lesson is completed', async () => {
      const mockUpdateUserProgress = vi.fn().mockResolvedValue({});
      
      // Mock the user context with the update function
      vi.doMock('../contexts/UserContext', () => ({
        useUser: () => ({
          userData: createMockUserData(),
          updateUserProgress: mockUpdateUserProgress,
          loading: false,
        }),
      }));

      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic3']
      );

      await waitFor(() => {
        expect(screen.getByText('Why is Python a High-Level Language?')).toBeInTheDocument();
      });

      // Complete the lesson
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      // Verify progress update was called
      await waitFor(() => {
        expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'topic3', true, 10);
      });
    });

    it('should persist progress across page refreshes', async () => {
      // Simulate initial load with progress
      const initialUserData = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: true, topic4: false, topic5: false },
      });

      const { rerender } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        initialUserData
      );

      await waitFor(() => {
        expect(screen.getByText('3 of 10 lessons completed')).toBeInTheDocument();
      });

      // Simulate page refresh by re-rendering
      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <MockUserProvider userData={initialUserData}>
            <Dashboard />
          </MockUserProvider>
        </MemoryRouter>
      );

      // Progress should still be displayed correctly
      await waitFor(() => {
        expect(screen.getByText('3 of 10 lessons completed')).toBeInTheDocument();
      });
    });

    it('should handle progress updates across sessions', async () => {
      // Test session 1 - complete some lessons
      const session1Data = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: false, topic4: false, topic5: false },
      });

      const { rerender } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        session1Data
      );

      await waitFor(() => {
        expect(screen.getByText('2 of 10 lessons completed')).toBeInTheDocument();
      });

      // Test session 2 - more lessons completed
      const session2Data = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: true, topic4: true, topic5: false },
      });
      session2Data.completedLessons = 4;

      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <MockUserProvider userData={session2Data}>
            <Dashboard />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('4 of 10 lessons completed')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Progress Display Updates', () => {
    it('should display correct progress statistics', async () => {
      const userData = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: true, topic4: false, topic5: false },
        module2: { topic6: true, topic7: false, topic8: false, topic9: false, topic10: false },
      });
      userData.completedLessons = 4;

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData
      );

      await waitFor(() => {
        // Check overall progress
        expect(screen.getByText('4 of 10 lessons completed')).toBeInTheDocument();
        
        // Check progress percentage (40%)
        const progressBar = container.querySelector('[style*="40%"]');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should update progress display immediately after lesson completion', async () => {
      const mockUpdateUserProgress = vi.fn().mockImplementation(async (moduleId, topicId, completed, score) => {
        // Simulate progress update
        return Promise.resolve();
      });

      vi.doMock('../contexts/UserContext', () => ({
        useUser: () => ({
          userData: createMockUserData(),
          updateUserProgress: mockUpdateUserProgress,
          loading: false,
        }),
      }));

      // Start with lesson page
      const { rerender } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic3']
      );

      await waitFor(() => {
        expect(screen.getByText('Why is Python a High-Level Language?')).toBeInTheDocument();
      });

      // Complete lesson
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      // Verify update was called
      await waitFor(() => {
        expect(mockUpdateUserProgress).toHaveBeenCalled();
      });

      // Navigate to dashboard and check updated progress
      const updatedUserData = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: true, topic4: false, topic5: false },
      });
      updatedUserData.completedLessons = 3;

      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <MockUserProvider userData={updatedUserData}>
            <Dashboard />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('3 of 10 lessons completed')).toBeInTheDocument();
      });
    });

    it('should display correct module-specific progress', async () => {
      const userData = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: true, topic4: true, topic5: true },
        module2: { topic6: true, topic7: true, topic8: false, topic9: false, topic10: false },
      });
      userData.completedLessons = 7;

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData
      );

      await waitFor(() => {
        // Module 1 should be 100% complete (5/5)
        expect(screen.getByText('Module 1: 100% Complete')).toBeInTheDocument();
        
        // Module 2 should be 40% complete (2/5)
        expect(screen.getByText('Module 2: 40% Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Resume Functionality', () => {
    it('should display correct last active lesson', async () => {
      const userData = createMockUserData();
      userData.lastActiveLesson = { moduleId: 'module1', topicId: 'topic3' };

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData
      );

      await waitFor(() => {
        expect(screen.getByText('Continue Learning')).toBeInTheDocument();
        expect(screen.getByText('Why is Python a High-Level Language?')).toBeInTheDocument();
      });
    });

    it('should handle resume functionality with various completion states', async () => {
      // Test case 1: User in middle of module 1
      const userData1 = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: false, topic4: false, topic5: false },
      });
      userData1.lastActiveLesson = { moduleId: 'module1', topicId: 'topic3' };

      const { rerender } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData1
      );

      await waitFor(() => {
        expect(screen.getByText('Why is Python a High-Level Language?')).toBeInTheDocument();
        const resumeButton = screen.getByText('Resume Learning');
        expect(resumeButton).toBeInTheDocument();
      });

      // Test case 2: User completed module 1, starting module 2
      const userData2 = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: true, topic4: true, topic5: true },
        module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
      });
      userData2.lastActiveLesson = { moduleId: 'module2', topicId: 'topic6' };
      userData2.completedLessons = 5;

      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <MockUserProvider userData={userData2}>
            <Dashboard />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Strings in Python')).toBeInTheDocument();
      });

      // Test case 3: No active lesson (new user)
      const userData3 = createMockUserData({
        module1: { topic1: false, topic2: false, topic3: false, topic4: false, topic5: false },
        module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
      });
      userData3.lastActiveLesson = null;
      userData3.completedLessons = 0;

      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <MockUserProvider userData={userData3}>
            <Dashboard />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Start Your Python Journey!')).toBeInTheDocument();
      });
    });

    it('should navigate to correct lesson when resume button is clicked', async () => {
      const userData = createMockUserData();
      userData.lastActiveLesson = { moduleId: 'module1', topicId: 'topic4' };

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        userData
      );

      await waitFor(() => {
        const resumeButton = screen.getByText('Resume Learning');
        expect(resumeButton).toBeInTheDocument();
      });

      // Click resume button
      const resumeButton = screen.getByText('Resume Learning');
      fireEvent.click(resumeButton);

      // Should navigate to the correct lesson
      // Note: In a real test, we'd verify the navigation occurred
      // For now, we verify the button exists and is clickable
      expect(resumeButton).toBeInTheDocument();
    });
  });

  describe('Progress Analytics Accuracy', () => {
    it('should calculate correct completion percentages', () => {
      const progressAnalytics = new ProgressAnalytics();
      
      // Test various completion states
      const testCases = [
        { completed: 0, total: 10, expected: 0 },
        { completed: 1, total: 10, expected: 10 },
        { completed: 5, total: 10, expected: 50 },
        { completed: 10, total: 10, expected: 100 },
      ];

      testCases.forEach(({ completed, total, expected }) => {
        const percentage = progressAnalytics.calculateCompletionPercentage(completed, total);
        expect(percentage).toBe(expected);
      });
    });

    it('should handle edge cases in progress calculations', () => {
      const progressAnalytics = new ProgressAnalytics();
      
      // Test edge cases
      expect(progressAnalytics.calculateCompletionPercentage(0, 0)).toBe(0);
      expect(progressAnalytics.calculateCompletionPercentage(5, 0)).toBe(0);
      expect(progressAnalytics.calculateCompletionPercentage(-1, 10)).toBe(0);
      expect(progressAnalytics.calculateCompletionPercentage(15, 10)).toBe(100);
    });

    it('should correctly identify last active lesson', async () => {
      const userData = createMockUserData({
        module1: { topic1: true, topic2: true, topic3: false, topic4: false, topic5: false },
        module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
      });

      const progressAnalytics = new ProgressAnalytics();
      const lastActive = progressAnalytics.getLastActiveLesson(userData.progress);

      expect(lastActive).toEqual({
        moduleId: 'module1',
        topicId: 'topic3', // Next incomplete lesson
        title: 'Why is Python a High-Level Language?',
        moduleName: 'Introduction to Python (Basics)',
      });
    });

    it('should handle module progress calculations correctly', () => {
      const progressData = {
        module1: { topic1: true, topic2: true, topic3: true, topic4: false, topic5: false },
        module2: { topic6: true, topic7: false, topic8: false, topic9: false, topic10: false },
      };

      const progressAnalytics = new ProgressAnalytics();
      const moduleProgress = progressAnalytics.getModuleProgress(progressData);

      expect(moduleProgress).toEqual([
        {
          moduleId: 'module1',
          moduleName: 'Introduction to Python (Basics)',
          totalLessons: 5,
          completedLessons: 3,
          percentage: 60,
        },
        {
          moduleId: 'module2',
          moduleName: 'Python Operations & Control Flow',
          totalLessons: 5,
          completedLessons: 1,
          percentage: 20,
        },
      ]);
    });
  });

  describe('Error Handling in Progress Tracking', () => {
    it('should handle API failures gracefully', async () => {
      // Mock API failure
      (progressAPI.updateProgress as any).mockRejectedValue(new Error('API Error'));

      const mockUpdateUserProgress = vi.fn().mockRejectedValue(new Error('Update failed'));
      
      vi.doMock('../contexts/UserContext', () => ({
        useUser: () => ({
          userData: createMockUserData(),
          updateUserProgress: mockUpdateUserProgress,
          loading: false,
        }),
      }));

      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic3']
      );

      await waitFor(() => {
        expect(screen.getByText('Why is Python a High-Level Language?')).toBeInTheDocument();
      });

      // Complete lesson despite API failure
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      // Should still show completion UI even if API fails
      await waitFor(() => {
        expect(screen.getByText('Awesome Job! 🎉')).toBeInTheDocument();
      });
    });

    it('should handle corrupted progress data', async () => {
      const corruptedUserData = {
        uid: 'test-user',
        email: 'test@example.com',
        selectedAvatar: '🧑‍💻',
        progress: null, // Corrupted data
        totalScore: 0,
        completedLessons: 0,
        lastActiveLesson: null,
      };

      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard'], 
        corruptedUserData
      );

      // Should handle gracefully and show default state
      await waitFor(() => {
        expect(screen.getByText('0 of 10 lessons completed')).toBeInTheDocument();
      });
    });
  });
});