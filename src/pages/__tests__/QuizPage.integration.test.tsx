import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizPage from '../QuizPage';
import { progressAPI, analyticsAPI } from '../../services/api';

// Mock the API services
vi.mock('../../services/api', () => ({
  progressAPI: {
    saveQuizResult: vi.fn(),
  },
  analyticsAPI: {
    trackEvent: vi.fn(),
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

// Mock UserContext with realistic implementation
const mockUpdateUserProgress = vi.fn();
const mockUserData = {
  id: 'test-user',
  email: 'test@example.com',
  selectedAvatar: {
    name: 'TestBot',
    avatar: '🤖'
  },
  progress: {
    module1: {
      topic1: { completed: true, score: 10 },
      topic2: { completed: true, score: 8 }
    }
  },
  totalScore: 18
};

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    userData: mockUserData,
    updateUserProgress: mockUpdateUserProgress,
  }),
}));

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
}));

// Mock components
vi.mock('../../components/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('../../components/Button', () => ({
  default: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`btn ${variant} ${size} ${className}`}
      {...props}
    >
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

describe('QuizPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset API mocks to return successful responses
    vi.mocked(progressAPI.saveQuizResult).mockResolvedValue({ success: true });
    vi.mocked(analyticsAPI.trackEvent).mockResolvedValue({ success: true });
    vi.mocked(mockUpdateUserProgress).mockResolvedValue(undefined);
  });

  describe('Quiz Completion and Progress Integration', () => {
    it('completes quiz and integrates with progress tracking system', async () => {
      renderQuizPage();
      
      // Answer all questions correctly
      const correctAnswers = [
        'Giving step-by-step instructions to computers',
        'It\'s easy to read and learn, almost like English',
        'my_age',
        'String',
        'Shows \'Hi there!\' on the screen'
      ];
      
      // Go through each question
      for (let i = 0; i < correctAnswers.length; i++) {
        // Find and click the correct answer
        const answerButton = screen.getByText(correctAnswers[i]);
        fireEvent.click(answerButton);
        
        // Wait for explanation to appear
        await waitFor(() => {
          expect(screen.getByText('Explanation:')).toBeInTheDocument();
        });
        
        // Click next/finish button
        const nextButton = screen.getByText(i < 4 ? 'Next Question' : 'Finish Quiz');
        fireEvent.click(nextButton);
        
        // If not the last question, wait for next question to load
        if (i < 4) {
          await waitFor(() => {
            expect(screen.getByText(`Question ${i + 2} of 5`)).toBeInTheDocument();
          });
        }
      }
      
      // Wait for completion screen
      await waitFor(() => {
        expect(screen.getByText('Amazing! 🎉')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
      
      // Verify API integrations were called correctly
      expect(analyticsAPI.trackEvent).toHaveBeenCalledWith('user', 'quiz_completed', {
        moduleId: 'module1',
        score: 100,
        correctAnswers: 5,
        totalQuestions: 5
      });
      
      expect(progressAPI.saveQuizResult).toHaveBeenCalledWith('user', {
        moduleId: 'module1',
        score: 100,
        totalQuestions: 5,
        correctAnswers: 5,
        completedAt: expect.any(String)
      });
      
      expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'quiz', true, 100);
    });

    it('handles partial correct answers and calculates score correctly', async () => {
      renderQuizPage();
      
      // Answer some questions correctly, some incorrectly
      const answers = [
        'Giving step-by-step instructions to computers', // Correct
        'It\'s named after a snake', // Incorrect
        'my_age', // Correct
        'Integer', // Incorrect
        'Shows \'Hi there!\' on the screen' // Correct
      ];
      
      // Go through each question
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
      
      // Wait for completion screen - should show 60% (3 out of 5 correct)
      await waitFor(() => {
        expect(screen.getByText('Good Job! 👏')).toBeInTheDocument();
        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(screen.getByText('You got 3 out of 5 questions correct!')).toBeInTheDocument();
      });
      
      // Verify correct score was tracked
      expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'quiz', true, 60);
    });

    it('handles API errors gracefully without breaking user experience', async () => {
      // Mock API to throw errors
      vi.mocked(progressAPI.saveQuizResult).mockRejectedValue(new Error('API Error'));
      vi.mocked(analyticsAPI.trackEvent).mockRejectedValue(new Error('Analytics Error'));
      vi.mocked(mockUpdateUserProgress).mockRejectedValue(new Error('Progress Error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderQuizPage();
      
      // Complete quiz quickly
      for (let i = 0; i < 5; i++) {
        const answerButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent && 
          !btn.textContent.includes('Back to Dashboard') &&
          !btn.textContent.includes('Next Question') &&
          !btn.textContent.includes('Finish Quiz') &&
          !btn.textContent.includes('Continue Learning') &&
          !btn.textContent.includes('Try Again')
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
      
      // Should still show completion screen despite API errors
      await waitFor(() => {
        expect(screen.getByText(/Amazing!|Good Job!|Keep Learning!/)).toBeInTheDocument();
      });
      
      // Should log error but not crash
      expect(consoleSpy).toHaveBeenCalledWith('Error updating quiz progress:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Quiz Reset and Retry Functionality', () => {
    it('resets quiz state correctly when Try Again is clicked', async () => {
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
      
      // Wait for completion screen
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'));
      
      // Should be back to first question with reset state
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
        expect(screen.getByText('What is programming?')).toBeInTheDocument();
        // Should not show any selected answers or explanations
        expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('navigates to dashboard correctly from completion screen', async () => {
      renderQuizPage();
      
      // Complete quiz quickly
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
      
      // Wait for completion screen and click Continue Learning
      await waitFor(() => {
        const continueButton = screen.getByText('Continue Learning');
        fireEvent.click(continueButton);
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('handles back navigation correctly', () => {
      renderQuizPage();
      
      const backButton = screen.getByText('Back to Dashboard');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Module 2 Quiz Integration', () => {
    it('works correctly with module2 quiz', () => {
      // Mock useParams to return module2
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ moduleId: 'module2' });
      
      renderQuizPage();
      
      // Should show module2 first question
      expect(screen.getByText('How do you add two strings together?')).toBeInTheDocument();
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid module ID gracefully', () => {
      // Mock useParams to return invalid moduleId
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ moduleId: 'invalid' });
      
      renderQuizPage();
      
      expect(screen.getByText('Quiz not found')).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });
});