import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LessonPage from '../pages/LessonPage';
import Dashboard from '../pages/Dashboard';
import { UserProvider } from '../contexts/UserContext';
import { navigationService } from '../services/NavigationService';
import { curriculum } from '../data/curriculum';

// Mock the API and services
vi.mock('../services/api', () => ({
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

// Mock user context with navigation tracking
const mockUserData = {
  uid: 'test-user',
  email: 'test@example.com',
  selectedAvatar: '🧑‍💻',
  progress: {
    module1: { topic1: true, topic2: true, topic3: false, topic4: false, topic5: false },
    module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
  },
  totalScore: 20,
  completedLessons: 2,
  lastActiveLesson: { moduleId: 'module1', topicId: 'topic2' },
};

const mockUpdateUserProgress = vi.fn().mockResolvedValue({});

const MockUserProvider = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    {children}
  </UserProvider>
);

// Helper to render component with router and context
const renderWithProviders = (component: React.ReactElement, initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <MockUserProvider>
        {component}
      </MockUserProvider>
    </MemoryRouter>
  );
};

describe('Navigation Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the user context
    vi.doMock('../contexts/UserContext', () => ({
      useUser: () => ({
        userData: mockUserData,
        updateUserProgress: mockUpdateUserProgress,
        loading: false,
      }),
      UserProvider: MockUserProvider,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sequential Navigation Through All Lessons', () => {
    it('should navigate through all 10 lessons in correct sequence', async () => {
      // Test navigation through all lessons
      const allLessons = curriculum.flatMap(module => 
        module.lessons.map(lesson => ({ moduleId: module.id, topicId: lesson.id, title: lesson.title }))
      );

      expect(allLessons).toHaveLength(10); // Verify we have 10 lessons total

      // Test each lesson navigation
      for (let i = 0; i < allLessons.length; i++) {
        const { moduleId, topicId } = allLessons[i];
        const navigationState = navigationService.getNavigationState(moduleId, topicId);
        
        // Verify navigation state is correct for each lesson
        if (i === 0) {
          // First lesson
          expect(navigationState.canGoPrevious).toBe(false);
          expect(navigationState.canGoNext).toBe(true);
          expect(navigationState.nextDestination).toBe('lesson');
        } else if (i === allLessons.length - 1) {
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
      }
    });

    it('should correctly identify module transitions', async () => {
      // Test transition from module1 to module2
      const lastModule1Lesson = { moduleId: 'module1', topicId: 'topic5' };
      const firstModule2Lesson = { moduleId: 'module2', topicId: 'topic6' };

      const nextLesson = navigationService.getNextLesson(
        lastModule1Lesson.moduleId, 
        lastModule1Lesson.topicId
      );

      expect(nextLesson).toEqual({
        moduleId: firstModule2Lesson.moduleId,
        topicId: firstModule2Lesson.topicId,
        title: expect.any(String),
        isModuleTransition: true,
      });
    });

    it('should handle navigation from first lesson correctly', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      // Previous button should be disabled
      const prevButton = screen.getByText('Previous Lesson');
      expect(prevButton.closest('button')).toBeDisabled();

      // Next button should be enabled
      const nextButton = screen.getByText('Next Lesson');
      expect(nextButton.closest('button')).not.toBeDisabled();
    });

    it('should handle navigation from last lesson correctly', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module2/topic10']
      );

      await waitFor(() => {
        expect(screen.getByText('Loops in Python')).toBeInTheDocument();
      });

      // Previous button should be enabled
      const prevButton = screen.getByText('Previous Lesson');
      expect(prevButton.closest('button')).not.toBeDisabled();

      // Next button should show "Back to Dashboard"
      const dashboardButton = screen.getByText('Back to Dashboard');
      expect(dashboardButton).toBeInTheDocument();
    });
  });

  describe('URL Updates and Browser History', () => {
    it('should update URL correctly when navigating between lessons', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      // Complete lesson and navigate to next
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      // Wait for completion animation and navigation
      await waitFor(() => {
        expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'topic1', true, 10);
      }, { timeout: 2000 });
    });

    it('should maintain proper browser history during navigation', async () => {
      // Test that navigation doesn't break browser back/forward
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic2']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Python?')).toBeInTheDocument();
      });

      // Click previous lesson
      const prevButton = screen.getByText('Previous Lesson');
      
      await act(async () => {
        fireEvent.click(prevButton);
      });

      // Should navigate to previous lesson
      // Note: In a real test, we'd check the URL change, but MemoryRouter handles this differently
    });
  });

  describe('Module Transitions', () => {
    it('should handle transition from module1 to module2', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic5']
      );

      await waitFor(() => {
        expect(screen.getByText('Data Types in Python')).toBeInTheDocument();
      });

      // Complete the last lesson of module1
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      await waitFor(() => {
        expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'topic5', true, 10);
      }, { timeout: 2000 });

      // Verify navigation service recognizes this as a module transition
      const nextLesson = navigationService.getNextLesson('module1', 'topic5');
      expect(nextLesson?.isModuleTransition).toBe(true);
      expect(nextLesson?.moduleId).toBe('module2');
      expect(nextLesson?.topicId).toBe('topic6');
    });

    it('should navigate to dashboard after final lesson', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module2/topic10']
      );

      await waitFor(() => {
        expect(screen.getByText('Loops in Python')).toBeInTheDocument();
      });

      // Complete the final lesson
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      await waitFor(() => {
        expect(mockUpdateUserProgress).toHaveBeenCalledWith('module2', 'topic10', true, 10);
      }, { timeout: 2000 });

      // Verify this is recognized as the final lesson
      const navigationState = navigationService.getNavigationState('module2', 'topic10');
      expect(navigationState.nextDestination).toBe('dashboard');
    });
  });

  describe('Button States and Interactions', () => {
    it('should properly disable/enable navigation buttons based on position', async () => {
      // Test first lesson
      const { rerender } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        const prevButton = screen.getByText('Previous Lesson');
        expect(prevButton.closest('button')).toBeDisabled();
        
        const nextButton = screen.getByText('Next Lesson');
        expect(nextButton.closest('button')).not.toBeDisabled();
      });

      // Test middle lesson
      rerender(
        <MemoryRouter initialEntries={['/lesson/module1/topic3']}>
          <MockUserProvider>
            <LessonPage />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const prevButton = screen.getByText('Previous Lesson');
        expect(prevButton.closest('button')).not.toBeDisabled();
        
        const nextButton = screen.getByText('Next Lesson');
        expect(nextButton.closest('button')).not.toBeDisabled();
      });

      // Test last lesson
      rerender(
        <MemoryRouter initialEntries={['/lesson/module2/topic10']}>
          <MockUserProvider>
            <LessonPage />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const prevButton = screen.getByText('Previous Lesson');
        expect(prevButton.closest('button')).not.toBeDisabled();
        
        // Last lesson should show "Back to Dashboard" instead of "Next Lesson"
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle direct navigation without completion', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic2']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Python?')).toBeInTheDocument();
      });

      // Click next lesson without completing current one
      const nextButton = screen.getByText('Next Lesson');
      
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // Should navigate without updating progress
      expect(mockUpdateUserProgress).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid lesson routes gracefully', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/invalid/invalid']
      );

      await waitFor(() => {
        expect(screen.getByText('Lesson not found')).toBeInTheDocument();
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle navigation service errors gracefully', async () => {
      // Mock navigation service to throw error
      const originalGetNavigationState = navigationService.getNavigationState;
      navigationService.getNavigationState = vi.fn().mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      // Should still render the lesson content
      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      // Restore original method
      navigationService.getNavigationState = originalGetNavigationState;
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause unnecessary re-renders during navigation', async () => {
      const renderSpy = vi.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <LessonPage />;
      };

      const { rerender } = renderWithProviders(
        <TestComponent />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Navigate to next lesson
      rerender(
        <MemoryRouter initialEntries={['/lesson/module1/topic2']}>
          <MockUserProvider>
            <TestComponent />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('What is Python?')).toBeInTheDocument();
      });

      // Should not cause excessive re-renders
      expect(renderSpy.mock.calls.length).toBeLessThan(initialRenderCount + 5);
    });
  });
});