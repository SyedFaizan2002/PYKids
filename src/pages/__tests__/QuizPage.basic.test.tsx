import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizPage from '../QuizPage';

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
}));

// Mock API services
vi.mock('../../services/api', () => ({
  progressAPI: {
    saveQuizResult: vi.fn().mockResolvedValue({ success: true }),
  },
  analyticsAPI: {
    trackEvent: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock Framer Motion
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

describe('QuizPage Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderQuizPage();
    expect(screen.getByText('Module Quiz 🧠')).toBeInTheDocument();
  });

  it('displays the first question', () => {
    renderQuizPage();
    expect(screen.getByText('What is programming?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
  });

  it('displays answer options', () => {
    renderQuizPage();
    expect(screen.getByText('Playing video games')).toBeInTheDocument();
    expect(screen.getByText('Giving step-by-step instructions to computers')).toBeInTheDocument();
    expect(screen.getByText('Drawing pictures')).toBeInTheDocument();
    expect(screen.getByText('Singing songs')).toBeInTheDocument();
  });

  it('shows user avatar', () => {
    renderQuizPage();
    expect(screen.getByText('🤖')).toBeInTheDocument();
    expect(screen.getByText('TestBot')).toBeInTheDocument();
  });

  it('handles back to dashboard navigation', () => {
    renderQuizPage();
    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});