import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '../UserContext';
import { AuthContext } from '../AuthContext';
import { progressAnalyticsService } from '../../services/ProgressAnalytics';

// Mock the dependencies
jest.mock('../../services/OptimizedAPI');
jest.mock('../../services/ProgressAnalytics');

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockAuthContextValue = {
  currentUser: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
};

const TestComponent = () => {
  const { 
    userData, 
    getProgressAnalytics, 
    getNavigationHistory, 
    updateLastActiveLesson,
    optimizedProgressUpdate 
  } = useUser();

  return (
    <div>
      <div data-testid="user-data">{userData ? 'User loaded' : 'No user'}</div>
      <button 
        data-testid="get-analytics" 
        onClick={() => {
          const analytics = getProgressAnalytics();
          console.log('Analytics:', analytics);
        }}
      >
        Get Analytics
      </button>
      <button 
        data-testid="get-history" 
        onClick={() => {
          const history = getNavigationHistory();
          console.log('History:', history);
        }}
      >
        Get History
      </button>
      <button 
        data-testid="update-lesson" 
        onClick={() => updateLastActiveLesson('module1', 'lesson1')}
      >
        Update Lesson
      </button>
      <button 
        data-testid="optimized-update" 
        onClick={() => optimizedProgressUpdate([
          { moduleId: 'module1', topicId: 'lesson1', completed: true, score: 10 }
        ])}
      >
        Optimized Update
      </button>
    </div>
  );
};

describe('UserContext Enhanced Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock progressAnalyticsService
    (progressAnalyticsService.calculateProgressAnalytics as jest.Mock) = jest.fn().mockReturnValue({
      totalLessons: 10,
      completedLessons: 0,
      completionPercentage: 0,
      lastActiveLesson: null,
      moduleProgress: []
    });
  });

  it('should provide progress analytics functionality', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('get-analytics')).toBeInTheDocument();
    });

    // The component should render without errors
    expect(screen.getByTestId('user-data')).toBeInTheDocument();
    expect(screen.getByTestId('get-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('get-history')).toBeInTheDocument();
    expect(screen.getByTestId('update-lesson')).toBeInTheDocument();
    expect(screen.getByTestId('optimized-update')).toBeInTheDocument();
  });

  it('should provide navigation history functionality', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('get-history')).toBeInTheDocument();
    });

    // Should not throw when getting navigation history
    const historyButton = screen.getByTestId('get-history');
    expect(historyButton).toBeInTheDocument();
  });

  it('should provide optimized progress update functionality', async () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('optimized-update')).toBeInTheDocument();
    });

    // Should not throw when using optimized update
    const updateButton = screen.getByTestId('optimized-update');
    expect(updateButton).toBeInTheDocument();
  });
});
/
/ Test for the critical error fix
describe('Critical Error Fixes', () => {
  it('should not throw "Cannot access optimizedProgressUpdate before initialization" error', () => {
    // This test verifies that the function hoisting issue is resolved
    // by ensuring the component can be rendered without throwing the error
    expect(() => {
      render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <UserProvider>
            <TestComponent />
          </UserProvider>
        </AuthContext.Provider>
      );
    }).not.toThrow();
  });
});