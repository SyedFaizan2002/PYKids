/**
 * Integration test to verify the app doesn't crash on load
 * This specifically tests the UserContext initialization fix
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the contexts to prevent actual API calls
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../services/OptimizedAPI', () => ({
  optimizedAPI: {
    getUserProfile: jest.fn().mockResolvedValue({ success: false }),
    getUserProgress: jest.fn().mockResolvedValue({ success: false }),
    updateLessonProgress: jest.fn().mockResolvedValue({ success: true }),
    cache: {
      getStats: () => ({ size: 0 }),
      invalidateProfile: jest.fn()
    }
  }
}));

jest.mock('../services/ProgressAnalytics', () => ({
  progressAnalyticsService: {
    calculateProgressAnalytics: () => ({
      totalLessons: 0,
      completedLessons: 0,
      completionPercentage: 0,
      lastActiveLesson: null,
      moduleProgress: []
    })
  }
}));

// Simple test component that uses UserContext
const TestApp = () => {
  const { UserProvider } = require('../contexts/UserContext');
  
  return (
    <BrowserRouter>
      <UserProvider>
        <div data-testid="app-content">
          <h1>PyKIDS App</h1>
          <p>App loaded successfully!</p>
        </div>
      </UserProvider>
    </BrowserRouter>
  );
};

describe('App Integration - Critical Error Fix', () => {
  it('should render without throwing "Cannot access optimizedProgressUpdate before initialization" error', () => {
    // This test verifies that the UserContext can be initialized without the hoisting error
    expect(() => {
      render(<TestApp />);
    }).not.toThrow();
  });

  it('should render app content successfully', () => {
    const { getByTestId } = render(<TestApp />);
    
    // Should render the app content without crashing
    expect(getByTestId('app-content')).toBeInTheDocument();
  });

  it('should handle UserContext initialization gracefully', () => {
    // Test that UserContext can be used without errors
    const TestComponent = () => {
      const { useUser } = require('../contexts/UserContext');
      const { userData, loading } = useUser();
      
      return (
        <div data-testid="user-context-test">
          {loading ? 'Loading...' : (userData ? 'User loaded' : 'No user')}
        </div>
      );
    };

    const TestAppWithUserContext = () => {
      const { UserProvider } = require('../contexts/UserContext');
      
      return (
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );
    };

    expect(() => {
      render(<TestAppWithUserContext />);
    }).not.toThrow();
  });
});