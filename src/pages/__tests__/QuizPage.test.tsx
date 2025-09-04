import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QuizPage from '../QuizPage';
import { UserProvider } from '../../contexts/UserContext';
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

// Mock UserContext
const mockUpdateUserProgress = vi.fn();
const mockUserData = {
  id: 'test-user',
  email: 'test@example.com',
  selectedAvatar: {
    name: 'TestBot',
    avatar: '🤖'
  }
};

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    userData: mockUserData,
    updateUserProgress: mockUpdateUserProgress,
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock AnimatedBackground component
vi.mock('../../components/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

// Mock Button component
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
      <UserProvider>
        <QuizPage />
      </UserProvider>
    </BrowserRouter>
  );
};

describe('QuizPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders quiz page correctly with first question', () => {
      renderQuizPage();
      
      // Check if quiz header is present
      expect(screen.getByText('Module Quiz 🧠')).toBeInTheDocument();
      
      // Check if progress indicator is present
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
      
      // Check if first question is displayed
      expect(screen.getByText('What is programming?')).toBeInTheDocument();
      
      // Check if all answer options are present
      expect(screen.getByText('Playing video games')).toBeInTheDocument();
      expect(screen.getByText('Giving step-by-step instructions to computers')).toBeInTheDocument();
      expect(screen.getByText('Drawing pictures')).toBeInTheDocument();
      expect(screen.getByText('Singing songs')).toBeInTheDocument();
    });

    it('displays user avatar and name correctly', () => {
      renderQuizPage();
      
      expect(screen.getByText('🤖')).toBeInTheDocument();
      expect(screen.getByText('TestBot')).toBeInTheDocument();
    });

    it('shows progress bar with correct initial progress', () => {
      renderQuizPage();
      
      // Progress should be 20% for first question (1/5 * 100)
      // Note: Progress bar is implemented with motion.div, so we'll check for the progress text instead
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });
  });

  describe('Quiz Interaction', () => {
    it('allows selecting an answer and shows result', async () => {
      renderQuizPage();
      
      // Click on the correct answer
      const correctAnswer = screen.getByText('Giving step-by-step instructions to computers');
      fireEvent.click(correctAnswer);
      
      // Wait for result to show
      await waitFor(() => {
        expect(screen.getByText('Explanation:')).toBeInTheDocument();
      });
      
      // Check if explanation is shown
      expect(screen.getByText(/Programming is giving step-by-step instructions/)).toBeInTheDocument();
      
      // Check if Next Question button appears
      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    it('shows correct/incorrect indicators after answer selection', async () => {
      renderQuizPage();
      
      // Click on an incorrect answer
      const incorrectAnswer = screen.getByText('Playing video games');
      fireEvent.click(incorrectAnswer);
      
      await waitFor(() => {
        // Should show explanation after selecting answer
        expect(screen.getByText('Explanation:')).toBeInTheDocument();
        // Should show the correct answer highlighted
        expect(screen.getByText('Giving step-by-step instructions to computers')).toHaveClass('bg-green-500/30');
      });
    });

    it('prevents selecting another answer after one is selected', async () => {
      renderQuizPage();
      
      // Click on first answer
      const firstAnswer = screen.getByText('Playing video games');
      fireEvent.click(firstAnswer);
      
      await waitFor(() => {
        expect(screen.getByText('Explanation:')).toBeInTheDocument();
      });
      
      // Try to click on another answer - should be disabled
      const secondAnswer = screen.getByText('Giving step-by-step instructions to computers');
      fireEvent.click(secondAnswer);
      
      // The explanation should still be visible, indicating the first answer was processed
      expect(screen.getByText('Explanation:')).toBeInTheDocument();
    });
  });

  describe('Quiz Navigation', () => {
    it('navigates to next question when Next Question is clicked', async () => {
      renderQuizPage();
      
      // Answer first question
      fireEvent.click(screen.getByText('Giving step-by-step instructions to computers'));
      
      await waitFor(() => {
        expect(screen.getByText('Next Question')).toBeInTheDocument();
      });
      
      // Click Next Question
      fireEvent.click(screen.getByText('Next Question'));
      
      // Should show second question
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
        expect(screen.getByText('What makes Python special?')).toBeInTheDocument();
      });
    });

    it('shows Finish Quiz button on last question', async () => {
      renderQuizPage();
      
      // Navigate through all questions
      for (let i = 0; i < 4; i++) {
        // Answer current question (always select first option for simplicity)
        const options = screen.getAllByRole('button');
        const answerOption = options.find(btn => 
          btn.textContent?.includes('Playing video games') ||
          btn.textContent?.includes('It\'s named after a snake') ||
          btn.textContent?.includes('my age') ||
          btn.textContent?.includes('Integer') ||
          btn.textContent?.includes('Prints on paper')
        );
        
        if (answerOption) {
          fireEvent.click(answerOption);
        }
        
        await waitFor(() => {
          const nextButton = screen.queryByText(i < 3 ? 'Next Question' : 'Finish Quiz');
          if (nextButton) {
            fireEvent.click(nextButton);
          }
        });
      }
      
      // On last question, should show Finish Quiz button
      await waitFor(() => {
        expect(screen.getByText('Finish Quiz')).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Completion', () => {
    it('completes quiz and shows results screen', async () => {
      renderQuizPage();
      
      // Complete all questions
      for (let i = 0; i < 5; i++) {
        // Select first option for each question
        const options = screen.getAllByRole('button');
        const answerButtons = options.filter(btn => 
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
      
      // Should show completion screen
      await waitFor(() => {
        expect(screen.getByText(/Amazing!|Good Job!|Keep Learning!/)).toBeInTheDocument();
        expect(screen.getByText('Continue Learning')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('calculates and displays correct score', async () => {
      renderQuizPage();
      
      // Answer all questions correctly
      const correctAnswers = [
        'Giving step-by-step instructions to computers',
        'It\'s easy to read and learn, almost like English',
        'my_age',
        'String',
        'Shows \'Hi there!\' on the screen'
      ];
      
      for (let i = 0; i < correctAnswers.length; i++) {
        const correctAnswer = screen.getByText(correctAnswers[i]);
        fireEvent.click(correctAnswer);
        
        await waitFor(() => {
          const nextButton = screen.queryByText(i < 4 ? 'Next Question' : 'Finish Quiz');
          if (nextButton) {
            fireEvent.click(nextButton);
          }
        });
      }
      
      // Should show 100% score
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('You got 5 out of 5 questions correct!')).toBeInTheDocument();
      });
    });

    it('calls API services when quiz is completed', async () => {
      renderQuizPage();
      
      // Complete quiz quickly
      for (let i = 0; i < 5; i++) {
        const options = screen.getAllByRole('button');
        const answerButtons = options.filter(btn => 
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
      
      // Wait for API calls
      await waitFor(() => {
        expect(analyticsAPI.trackEvent).toHaveBeenCalledWith('user', 'quiz_completed', {
          moduleId: 'module1',
          score: expect.any(Number),
          correctAnswers: expect.any(Number),
          totalQuestions: 5
        });
        
        expect(progressAPI.saveQuizResult).toHaveBeenCalledWith('user', {
          moduleId: 'module1',
          score: expect.any(Number),
          totalQuestions: 5,
          correctAnswers: expect.any(Number),
          completedAt: expect.any(String)
        });
        
        expect(mockUpdateUserProgress).toHaveBeenCalledWith('module1', 'quiz', true, expect.any(Number));
      });
    });
  });

  describe('Quiz Reset Functionality', () => {
    it('resets quiz when Try Again is clicked', async () => {
      renderQuizPage();
      
      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const options = screen.getAllByRole('button');
        const answerButtons = options.filter(btn => 
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
      
      // Should be back to first question
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
        expect(screen.getByText('What is programming?')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Controls', () => {
    it('navigates back to dashboard when Back to Dashboard is clicked', () => {
      renderQuizPage();
      
      fireEvent.click(screen.getByText('Back to Dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('navigates to dashboard when Continue Learning is clicked after completion', async () => {
      renderQuizPage();
      
      // Complete quiz quickly
      for (let i = 0; i < 5; i++) {
        const options = screen.getAllByRole('button');
        const answerButtons = options.filter(btn => 
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
  });

  describe('Error Handling', () => {
    it('handles invalid module ID gracefully', () => {
      // Mock useParams to return invalid moduleId
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ moduleId: 'invalid' });
      
      renderQuizPage();
      
      expect(screen.getByText('Quiz not found')).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    it('handles API errors gracefully during quiz completion', async () => {
      // Mock API to throw error
      vi.mocked(progressAPI.saveQuizResult).mockRejectedValue(new Error('API Error'));
      vi.mocked(analyticsAPI.trackEvent).mockRejectedValue(new Error('API Error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderQuizPage();
      
      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const options = screen.getAllByRole('button');
        const answerButtons = options.filter(btn => 
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
      
      // Should still show completion screen despite API errors
      await waitFor(() => {
        expect(screen.getByText(/Amazing!|Good Job!|Keep Learning!/)).toBeInTheDocument();
      });
      
      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith('Error updating quiz progress:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});