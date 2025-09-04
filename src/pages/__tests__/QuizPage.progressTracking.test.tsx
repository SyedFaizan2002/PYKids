import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizPage from '../QuizPage';
import { progressAPI, analyticsAPI } from '../../services/api';
import { progressAnalyticsService } from '../../services/ProgressAnalytics';

// Mock the API services
vi.mock('../../services/api', () => ({
  progressAPI: {
    saveQuizResult: vi.fn(),
  },
  analyticsAPI: {
    trackEvent: vi.fn(),
  },
}));

// Mock ProgressAnalytics service
vi.mock('../../services/ProgressAnalytics', () => ({
  progressAnalyticsService: {
    getModuleCompletionStatus: vi.fn(),
  },
}));

// Mock React Router hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ moduleId: 'module1' }),
  };
});

// Mock UserContext with enhanced progress data
const mockUpdateUserProgress = vi.fn();
const mockUserData = {
  id: 'test-user-123',
  email: 'test@example.com',
  selectedAvatar: {
    name: 'TestBot',
    avatar: '🤖'
  },
  progress: {
    module1: {
      topic1: { completed: true, score: 10, completedAt: '2024-01-01T10:00:00Z' },
      topic2: { completed: true, score: 8, completedAt: '2024-01-01T11:00:00Z' },
      topic3: { completed: false, score: 0 }
    }
  },
  totalScore: 18,
  lastActiveLesson: {
    moduleId: 'module1',
    topicId: 'topic3'
  }
};

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    userData: mockUserData,
    updateUserProgress: mockUpdateUserProgress,
  }),
}));

// Mock Framer Motion and components
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
}));

vi.mock('../../components/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('../../components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const renderQuizPage = () => {
  return render(
    <BrowserRouter>
      <QuizPage />
    </BrowserRouter>
  );
};

describe('QuizPage Enhanced Progress Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    vi.mocked(progressAPI.saveQuizResult).mockResolvedValue({ success: true });
    vi.mocked(analyticsAPI.trackEvent).mockResolvedValue({ success: true });
    vi.mocked(mockUpdateUserProgress).mockResolvedValue(undefined);
    vi.mocked(progressAnalyticsService.getModuleCompletionStatus).mockReturnValue({
      isCompleted: false,
      completedLessons: 2,
      totalLessons: 5,
      percentage: 40
    });
  });

  describe('Quiz Start Analytics', () => {
    it('tracks quiz start event with correct data', async () => {
      renderQuizPage();
      
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith(
          'test-user-123',
          'quiz_started',
          {
            moduleId: 'module1',
            totalQuestions: 5,
            timestamp: expect.any(String)
          }
        );
      });
    });
  });

  describe('Answer Selection Analytics', () => {
    it('tracks answer selection with detailed analytics', async () => {
      renderQuizPage();
      
      // Click on correct answer
      const correctAnswer = screen.getByText('Giving step-by-step instructions to computers');
      fireEvent.click(correctAnswer);
      
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith(
          'test-user-123',
          'quiz_answer_selected',
          {
            moduleId: 'module1',
            questionId: 1,
            questionNumber: 1,
            selectedAnswer: 1,
            correctAnswer: 1,
            isCorrect: true,
            timestamp: expect.any(String)
          }
        );
      });
    });

    it('tracks incorrect answer selection correctly', async () => {
      renderQuizPage();
      
      // Click on incorrect answer
      const incorrectAnswer = screen.getByText('Playing video games');
      fireEvent.click(incorrectAnswer);
      
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith(
          'test-user-123',
          'quiz_answer_selected',
          {
            moduleId: 'module1',
            questionId: 1,
            questionNumber: 1,
            selectedAnswer: 0,
            correctAnswer: 1,
            isCorrect: false,
            timestamp: expect.any(String)
          }
        );
      });
    });
  });

  describe('Quiz Completion Analytics', () => {
    it('tracks comprehensive completion analytics with timing data', async () => {
      renderQuizPage();
      
      // Complete quiz with perfect score
      const correctAnswers = [
        'Giving step-by-step instructions to computers',
        'It\'s easy to read and learn, almost like English',
        'my_age',
        'String',
        'Shows \'Hi there!\' on the screen'
      ];
      
      for (let i = 0; i < correctAnswers.length; i++) {
        const answerButton = screen.getByText(correctAnswers[i]);
        fireEvent.click(answerButton);
        
        await waitFor(() => {
          expect(screen.getByText('Explanation:')).toBeInTheDocument();
        });
        
        const nextButton = screen.getByText(i < 4 ? 'Next Question' : 'Finish Quiz');
        fireEvent.click(nextButton);
        
        if (i < 4) {
          await waitFor(() => {
            expect(screen.getByText(`Question ${i + 2} of 5`)).toBeInTheDocument();
          });
        }
      }
      
      // Verify comprehensive completion analytics
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith(
          'test-user-123',
          'quiz_completed',
          {
            moduleId: 'module1',
            score: 100,
            correctAnswers: 5,
            totalQuestions: 5,
            timeSpentMs: expect.any(Number),
            timeSpentMinutes: expect.any(Number),
            averageTimePerQuestion: expect.any(Number),
            timestamp: expect.any(String)
          }
        );
      });
      
      // Verify module completion analytics
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith(
          'test-user-123',
          'module_quiz_completed',
          {
            moduleId: 'module1',
            score: 100,
            performance: 'excellent',
            moduleProgress: 40,
            isModuleCompleted: false,
            timeSpentMinutes: expect.any(Number),
            timestamp: expect.any(String)
          }
        );
      });
    });

    it('tracks different performance levels correctly', async () => {
      renderQuizPage();
      
      // Complete quiz with 60% score (3 correct, 2 incorrect)
      const answers = [
        'Giving step-by-step instructions to computers', // Correct
        'It\'s named after a snake', // Incorrect
        'my_age', // Correct
        'Integer', // Incorrect
        'Shows \'Hi there!\' on the screen' // Correct
      ];
      
      for (let i = 0; i < answers.length; i++) {
        const answerButton = screen.getByText(answers[i]);
        fireEvent.click(answerButton);
        
        await waitFor(() => {
          expect(screen.getByText('Explanation:')).toBeInTheDocument();
        });
        
        const nextButton = screen.getByText(i < 4 ? 'Next Question' : 'Finish Quiz');
        fireEvent.click(nextButton);
        
        if (i < 4) {
          await waitFor(() => {
            expect(screen.getByText(`Question ${i + 2} of 5`)).toBeInTheDocument();
          });
        }
      }
      
      // Verify performance classification
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith(
          'test-user-123',
          'module_quiz_completed',
          expect.objectContaining({
            score: 60,
            performance: 'good'
          })
        );
      });
    });
  });

  describe('Progress Integration', () => {
    it('integrates quiz completion with progress analytics service', async () => {
      renderQuizPage();
      
      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const answerButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent && 
          !btn.textContent.includes('Back to Dashboard') &&
          !btn.textContent.includes('Next Question') &&
          !btn.textContent.includes('Finish Quiz')
        );
        
        if (answerButtons[0]) {
          fireEvent.click(answerButtons[0]);
        }
        
        await waitFor(() => {
          const nextButton = screen.queryByText(i < 4 ? 'Next Question' : 'Finish Quiz');
          if (nextButton) {
            fireEvent.click(nextButton);
          }
        });
      }
      
      // Verify progress analytics service was called
      await waitFor(() => {
        expect(progressAnalyticsService.getModuleCompletionStatus).toHaveBeenCalledWith(
          mockUserData.progress,
          'module1'
        );
      });
      
      // Verify progress update was called correctly
      expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'quiz', true, expect.any(Number));
    });

    it('saves detailed quiz results for dashboard integration', async () => {
      renderQuizPage();
      
      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const answerButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent && 
          !btn.textContent.includes('Back to Dashboard') &&
          !btn.textContent.includes('Next Question') &&
          !btn.textContent.includes('Finish Quiz')
        );
        
        if (answerButtons[0]) {
          fireEvent.click(answerButtons[0]);
        }
        
        await waitFor(() => {
          const nextButton = screen.queryByText(i < 4 ? 'Next Question' : 'Finish Quiz');
          if (nextButton) {
            fireEvent.click(nextButton);
          }
        });
      }
      
      // Verify detailed quiz result was saved
      await waitFor(() => {
        expect(progressAPI.saveQuizResult).toHaveBeenCalledWith(
          'test-user-123',
          {
            moduleId: 'module1',
            score: expect.any(Number),
            totalQuestions: 5,
            correctAnswers: expect.any(Number),
            completedAt: expect.any(String)
          }
        );
      });
    });
  });

  describe('Quiz Reset Analytics', () => {
    it('tracks quiz reset events with previous performance data', async () => {
      renderQuizPage();
      
      // Complete quiz first
      for (let i = 0; i < 5; i++) {
        const answerButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent && 
          !btn.textContent.includes('Back to Dashboard') &&
          !btn.textContent.includes('Next Question') &&
          !btn.textContent.includes('Finish Quiz')
        );
        
        if (answerButtons[0]) {
          fireEvent.click(answerButtons[0]);
        }
        
        await waitFor(() => {
          const nextButton = screen.queryByText(i < 4 ? 'Next Question' : 'Finish Quiz');
          if (nextButton) {
            fireEvent.click(nextButton);
          }
        });
      }
      
      // Wait for completion and click Try Again
      await waitFor(() => {
        const tryAgainButton = screen.getByText('Try Again');
        fireEvent.click(tryAgainButton);
      });
      
      // Verify reset analytics
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith(
          'test-user-123',
          'quiz_reset',
          {
            moduleId: 'module1',
            previousScore: expect.any(Number),
            questionsCompleted: 5,
            timestamp: expect.any(String)
          }
        );
      });
    });
  });

  describe('Error Handling in Progress Tracking', () => {
    it('continues to show completion screen even if analytics fail', async () => {
      // Mock analytics to fail
      vi.mocked(analyticsAPI.trackEvent).mockRejectedValue(new Error('Analytics Error'));
      vi.mocked(progressAPI.saveQuizResult).mockRejectedValue(new Error('API Error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderQuizPage();
      
      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const answerButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent && 
          !btn.textContent.includes('Back to Dashboard') &&
          !btn.textContent.includes('Next Question') &&
          !btn.textContent.includes('Finish Quiz')
        );
        
        if (answerButtons[0]) {
          fireEvent.click(answerButtons[0]);
        }
        
        await waitFor(() => {
          const nextButton = screen.queryByText(i < 4 ? 'Next Question' : 'Finish Quiz');
          if (nextButton) {
            fireEvent.click(nextButton);
          }
        });
      }
      
      // Should still show completion screen
      await waitFor(() => {
        expect(screen.getByText(/Amazing!|Good Job!|Keep Learning!/)).toBeInTheDocument();
      });
      
      // Should log errors but not crash
      expect(consoleSpy).toHaveBeenCalledWith('Error updating quiz progress:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});