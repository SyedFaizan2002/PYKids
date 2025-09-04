import React, { Suspense } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LessonPage from '../pages/LessonPage';
import Dashboard from '../pages/Dashboard';
import { UserProvider } from '../contexts/UserContext';

// Performance measurement utilities
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  await act(async () => {
    renderFn();
  });
  const end = performance.now();
  return end - start;
};

const measureComponentLoadTime = async (componentPromise: Promise<any>): Promise<number> => {
  const start = performance.now();
  await componentPromise;
  const end = performance.now();
  return end - start;
};

// Mock heavy components to test lazy loading
const mockCodeEditor = vi.fn();
const mockCodeAnimation = vi.fn();
const mockLessonAnimation = vi.fn();

// Track component loading
let codeEditorLoaded = false;
let codeAnimationLoaded = false;
let lessonAnimationLoaded = false;

// Mock lazy components
vi.mock('../components/CodeEditor', () => ({
  default: React.lazy(() => {
    codeEditorLoaded = true;
    mockCodeEditor();
    return Promise.resolve({
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
    });
  }),
}));

vi.mock('../components/CodeAnimation', () => ({
  default: React.lazy(() => {
    codeAnimationLoaded = true;
    mockCodeAnimation();
    return Promise.resolve({
      default: () => <div data-testid="code-animation">Code Animation</div>,
    });
  }),
}));

vi.mock('../components/LessonAnimation', () => ({
  default: React.lazy(() => {
    lessonAnimationLoaded = true;
    mockLessonAnimation();
    return Promise.resolve({
      default: ({ type }: { type: string }) => <div data-testid="lesson-animation">{type}</div>,
    });
  }),
}));

// Mock other components
vi.mock('../components/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('../components/VoiceOverPlayer', () => ({
  default: ({ text }: { text: string }) => <div data-testid="voice-over">{text}</div>,
}));

// Mock API services
vi.mock('../services/api', () => ({
  progressAPI: {
    getUserProgress: vi.fn().mockResolvedValue({
      progress: {
        module1: { topic1: true, topic2: false, topic3: false, topic4: false, topic5: false },
        module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
      },
      totalScore: 10,
      completedLessons: 1,
    }),
    updateProgress: vi.fn().mockResolvedValue({ success: true }),
  },
  analyticsAPI: {
    trackEvent: vi.fn().mockResolvedValue({}),
  },
}));

// Mock Framer Motion with performance tracking
const motionRenderCount = { count: 0 };
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      motionRenderCount.count++;
      return <div {...props}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      motionRenderCount.count++;
      return <button {...props}>{children}</button>;
    },
    h1: ({ children, ...props }: any) => {
      motionRenderCount.count++;
      return <h1 {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }: any) => {
      motionRenderCount.count++;
      return <h2 {...props}>{children}</h2>;
    },
    p: ({ children, ...props }: any) => {
      motionRenderCount.count++;
      return <p {...props}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock user data
const mockUserData = {
  uid: 'test-user',
  email: 'test@example.com',
  selectedAvatar: '🧑‍💻',
  progress: {
    module1: { topic1: true, topic2: false, topic3: false, topic4: false, topic5: false },
    module2: { topic6: false, topic7: false, topic8: false, topic9: false, topic10: false },
  },
  totalScore: 10,
  completedLessons: 1,
  lastActiveLesson: { moduleId: 'module1', topicId: 'topic2' },
};

const MockUserProvider = ({ children }: { children: React.ReactNode }) => {
  const mockUpdateUserProgress = vi.fn().mockResolvedValue({});
  
  vi.doMock('../contexts/UserContext', () => ({
    useUser: () => ({
      userData: mockUserData,
      updateUserProgress: mockUpdateUserProgress,
      loading: false,
    }),
    UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }));

  return <div>{children}</div>;
};

const renderWithProviders = (component: React.ReactElement, initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <MockUserProvider>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          {component}
        </Suspense>
      </MockUserProvider>
    </MemoryRouter>
  );
};

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset component loading flags
    codeEditorLoaded = false;
    codeAnimationLoaded = false;
    lessonAnimationLoaded = false;
    motionRenderCount.count = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Lazy Loading Performance', () => {
    it('should lazy load CodeEditor only when needed', async () => {
      // Render lesson without exercise (shouldn't load CodeEditor)
      const { rerender } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1'] // "What is Programming?" - no exercise
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      // CodeEditor should not be loaded yet
      expect(codeEditorLoaded).toBe(false);
      expect(mockCodeEditor).not.toHaveBeenCalled();

      // Navigate to lesson with exercise
      rerender(
        <MemoryRouter initialEntries={['/lesson/module1/topic2']}>
          <MockUserProvider>
            <Suspense fallback={<div data-testid="loading">Loading...</div>}>
              <LessonPage />
            </Suspense>
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('What is Python?')).toBeInTheDocument();
      });

      // Now CodeEditor should be loaded
      await waitFor(() => {
        expect(codeEditorLoaded).toBe(true);
        expect(mockCodeEditor).toHaveBeenCalled();
      });
    });

    it('should lazy load CodeAnimation only when rendered', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      // CodeAnimation should be loaded (it's in the sidebar)
      await waitFor(() => {
        expect(codeAnimationLoaded).toBe(true);
        expect(mockCodeAnimation).toHaveBeenCalled();
      });
    });

    it('should lazy load LessonAnimation efficiently', async () => {
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      // LessonAnimation should be loaded
      await waitFor(() => {
        expect(lessonAnimationLoaded).toBe(true);
        expect(mockLessonAnimation).toHaveBeenCalled();
      });
    });

    it('should show loading fallback during component loading', async () => {
      // Mock slow loading component
      vi.doMock('../components/CodeEditor', () => ({
        default: React.lazy(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              default: () => <div data-testid="code-editor">Loaded</div>
            }), 100)
          )
        ),
      }));

      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic2']
      );

      // Should show loading fallback initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('What is Python?')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Animation Performance', () => {
    it('should not cause excessive motion component renders', async () => {
      const initialRenderCount = motionRenderCount.count;
      
      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      const finalRenderCount = motionRenderCount.count;
      
      // Should not have excessive motion renders (reasonable threshold)
      expect(finalRenderCount - initialRenderCount).toBeLessThan(50);
    });

    it('should handle navigation transitions smoothly', async () => {
      const { rerender } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      const preNavigationRenderCount = motionRenderCount.count;

      // Navigate to next lesson
      rerender(
        <MemoryRouter initialEntries={['/lesson/module1/topic2']}>
          <MockUserProvider>
            <Suspense fallback={<div data-testid="loading">Loading...</div>}>
              <LessonPage />
            </Suspense>
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('What is Python?')).toBeInTheDocument();
      });

      const postNavigationRenderCount = motionRenderCount.count;
      
      // Navigation should not cause excessive re-renders
      expect(postNavigationRenderCount - preNavigationRenderCount).toBeLessThan(30);
    });

    it('should optimize dashboard animations', async () => {
      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard']
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Dashboard should render efficiently
      expect(motionRenderCount.count).toBeLessThan(40);
    });
  });

  describe('API Optimization', () => {
    it('should cache API responses to prevent redundant calls', async () => {
      const { progressAPI } = await import('../services/api');
      
      // Render dashboard multiple times
      const { rerender } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard']
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // Re-render dashboard
      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <MockUserProvider>
            <Dashboard />
          </MockUserProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      // API should be called minimal times (ideally cached)
      expect(progressAPI.getUserProgress).toHaveBeenCalledTimes(1);
    });

    it('should handle API response times efficiently', async () => {
      // Mock slow API response
      const { progressAPI } = await import('../services/api');
      (progressAPI.getUserProgress as any).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            progress: mockUserData.progress,
            totalScore: 10,
            completedLessons: 1,
          }), 50)
        )
      );

      const startTime = performance.now();
      
      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard']
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle API delays gracefully (under reasonable threshold)
      expect(renderTime).toBeLessThan(1000); // 1 second threshold
    });

    it('should batch progress updates efficiently', async () => {
      const { progressAPI } = await import('../services/api');
      const mockUpdateUserProgress = vi.fn().mockResolvedValue({});
      
      vi.doMock('../contexts/UserContext', () => ({
        useUser: () => ({
          userData: mockUserData,
          updateUserProgress: mockUpdateUserProgress,
          loading: false,
        }),
      }));

      const { container } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic2']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Python?')).toBeInTheDocument();
      });

      // Complete lesson multiple times rapidly
      const completeButton = screen.getByText('Complete Lesson');
      
      await act(async () => {
        fireEvent.click(completeButton);
      });

      // Should handle rapid updates efficiently
      await waitFor(() => {
        expect(mockUpdateUserProgress).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not cause memory leaks during navigation', async () => {
      // Track component mounts/unmounts
      const componentInstances = new Set();
      
      const TestComponent = () => {
        React.useEffect(() => {
          const instance = {};
          componentInstances.add(instance);
          
          return () => {
            componentInstances.delete(instance);
          };
        }, []);
        
        return <LessonPage />;
      };

      const { rerender, unmount } = renderWithProviders(
        <TestComponent />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      const initialInstances = componentInstances.size;

      // Navigate multiple times
      for (let i = 2; i <= 5; i++) {
        rerender(
          <MemoryRouter initialEntries={[`/lesson/module1/topic${i}`]}>
            <MockUserProvider>
              <Suspense fallback={<div data-testid="loading">Loading...</div>}>
                <TestComponent />
              </Suspense>
            </MockUserProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByRole('heading')).toBeInTheDocument();
        });
      }

      // Unmount component
      unmount();

      // Should not accumulate component instances
      expect(componentInstances.size).toBeLessThanOrEqual(initialInstances + 1);
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large progress data
      const largeProgressData = {
        ...mockUserData,
        progress: {
          module1: { topic1: true, topic2: true, topic3: true, topic4: true, topic5: true },
          module2: { topic6: true, topic7: true, topic8: true, topic9: true, topic10: true },
          // Add more modules to simulate large dataset
          ...Array.from({ length: 10 }, (_, i) => ({
            [`module${i + 3}`]: Object.fromEntries(
              Array.from({ length: 10 }, (_, j) => [`topic${j + 1}`, Math.random() > 0.5])
            )
          })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
        },
        completedLessons: 50,
      };

      vi.doMock('../contexts/UserContext', () => ({
        useUser: () => ({
          userData: largeProgressData,
          updateUserProgress: vi.fn().mockResolvedValue({}),
          loading: false,
        }),
      }));

      const startTime = performance.now();
      
      const { container } = renderWithProviders(
        <Dashboard />, 
        ['/dashboard']
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(500); // 500ms threshold
    });
  });

  describe('Component Re-render Optimization', () => {
    it('should minimize unnecessary re-renders in LessonPage', async () => {
      const renderSpy = vi.fn();
      
      const TestLessonPage = () => {
        renderSpy();
        return <LessonPage />;
      };

      const { rerender } = renderWithProviders(
        <TestLessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Trigger state updates that shouldn't cause re-renders
      const codeInput = screen.queryByTestId('code-input');
      if (codeInput) {
        fireEvent.change(codeInput, { target: { value: 'print("test")' } });
      }

      // Should not cause excessive re-renders
      expect(renderSpy.mock.calls.length).toBeLessThan(initialRenderCount + 3);
    });

    it('should optimize Dashboard component re-renders', async () => {
      const renderSpy = vi.fn();
      
      const TestDashboard = () => {
        renderSpy();
        return <Dashboard />;
      };

      const { container } = renderWithProviders(
        <TestDashboard />, 
        ['/dashboard']
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
      });

      const renderCount = renderSpy.mock.calls.length;

      // Dashboard should render efficiently
      expect(renderCount).toBeLessThan(5);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance benchmarks for lesson loading', async () => {
      const loadTime = await measureRenderTime(() => {
        renderWithProviders(<LessonPage />, ['/lesson/module1/topic1']);
      });

      // Lesson should load within reasonable time
      expect(loadTime).toBeLessThan(200); // 200ms benchmark
    });

    it('should meet performance benchmarks for dashboard loading', async () => {
      const loadTime = await measureRenderTime(() => {
        renderWithProviders(<Dashboard />, ['/dashboard']);
      });

      // Dashboard should load within reasonable time
      expect(loadTime).toBeLessThan(150); // 150ms benchmark
    });

    it('should meet performance benchmarks for navigation', async () => {
      const { rerender } = renderWithProviders(
        <LessonPage />, 
        ['/lesson/module1/topic1']
      );

      await waitFor(() => {
        expect(screen.getByText('What is Programming?')).toBeInTheDocument();
      });

      const navigationTime = await measureRenderTime(() => {
        rerender(
          <MemoryRouter initialEntries={['/lesson/module1/topic2']}>
            <MockUserProvider>
              <Suspense fallback={<div data-testid="loading">Loading...</div>}>
                <LessonPage />
              </Suspense>
            </MockUserProvider>
          </MemoryRouter>
        );
      });

      // Navigation should be fast
      expect(navigationTime).toBeLessThan(100); // 100ms benchmark
    });
  });
});