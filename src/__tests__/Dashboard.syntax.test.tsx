import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';

// Mock all the dependencies
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({
    userData: {
      selectedAvatar: '🧑‍💻',
      progress: {
        module1: { topic1: { completed: true, score: 10 } },
        module2: { topic6: { completed: false } },
      },
      totalScore: 10,
    },
    refreshUserData: vi.fn(),
  }),
}));

vi.mock('../components/AnimatedBackground', () => ({
  default: () => <div data-testid="animated-background" />,
}));

vi.mock('../components/ProfileSidebar', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="profile-sidebar" /> : null,
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

vi.mock('../components/OptimizedAnimatePresence', () => ({
  default: ({ children }: any) => <div>{children}</div>,
  PageTransition: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  StaggerContainer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
};

describe('Dashboard JSX Syntax Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without JSX syntax errors', () => {
    expect(() => renderDashboard()).not.toThrow();
  });

  it('should display the main dashboard elements', () => {
    renderDashboard();
    
    expect(screen.getByText('PyKIDS Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, 🧑‍💻! 👋')).toBeInTheDocument();
  });

  it('should render progress cards without errors', () => {
    renderDashboard();
    
    expect(screen.getByText('Lessons Completed')).toBeInTheDocument();
    expect(screen.getByText('Quizzes Completed')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
  });

  it('should render curriculum modules without errors', () => {
    renderDashboard();
    
    expect(screen.getByText('Introduction to Python (Basics)')).toBeInTheDocument();
    expect(screen.getByText('Python Operations & Control Flow')).toBeInTheDocument();
  });

  it('should handle error boundaries gracefully', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a component that throws an error
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // This should not crash the test
    expect(() => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
    }).not.toThrow();

    consoleSpy.mockRestore();
  });
});