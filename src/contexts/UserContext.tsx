import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { auth } from '../firebase/config';

export interface UserData {
  id?: string;
  email?: string;
  selectedAvatar?: string;
  progress: {
    [moduleId: string]: {
      [topicId: string]: {
        completed: boolean;
        score?: number;
        completedAt?: string;
      };
    };
  };
  totalScore: number;
  lastActiveLesson?: {
    moduleId: string;
    topicId: string;
  };
}

interface UserContextType {
  userData: UserData | null;
  updateUserProgress: (moduleId: string, topicId: string, completed: boolean, score?: number) => Promise<void>;
  setSelectedAvatar: (avatarId: string) => Promise<void>;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    if (!currentUser) {
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.error('Failed to get authentication token');
        setUserData(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/${currentUser.uid}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData({
          id: data.id,
          email: data.email,
          selectedAvatar: data.selectedAvatar,
          progress: data.progress || {},
          totalScore: data.totalScore || 0,
          lastActiveLesson: data.lastActiveLesson
        });
      } else if (response.status === 404) {
        const createResponse = await fetch(`http://localhost:5000/api/users/${currentUser.uid}/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            selectedAvatar: null,
            email: currentUser.email || ''
          })
        });

        if (createResponse.ok) {
          const newUser = await createResponse.json();
          setUserData({
            id: newUser.id,
            email: newUser.email,
            selectedAvatar: newUser.selectedAvatar,
            progress: {},
            totalScore: 0,
            lastActiveLesson: null
          });
        } else {
          console.error('Failed to create user profile');
          setUserData(null);
        }
      } else {
        console.error('Failed to fetch user profile');
        setUserData(null);
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setUserData({
        progress: {},
        totalScore: 0,
        lastActiveLesson: null
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const refreshUserData = async () => {
    if (currentUser) {
      await loadUserData();
    }
  };

  const setSelectedAvatar = async (avatarId: string) => {
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    setUserData(prev => prev ? { ...prev, selectedAvatar: avatarId } : null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.error('Failed to get authentication token');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/${currentUser.uid}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ selectedAvatar: avatarId })
      });

      if (!response.ok) {
        console.error('Failed to save avatar:', await response.text());
        return;
      }

      const updatedUser = await response.json();
      setUserData(prev => prev ? {
        ...prev,
        selectedAvatar: updatedUser.selectedAvatar
      } : null);
    } catch (error: any) {
      console.error('Error setting avatar:', error);
    }
  };

  const updateUserProgress = async (moduleId: string, topicId: string, completed: boolean, score = 10) => {
    if (!currentUser || !userData) {
      console.error('User not authenticated or userData not loaded');
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.error('Failed to get authentication token');
        return;
      }

      const updatedProgress = {
        ...userData.progress,
        [moduleId]: {
          ...(userData.progress[moduleId] || {}),
          [topicId]: {
            completed,
            score: completed ? score : userData.progress[moduleId]?.[topicId]?.score || 0,
            completedAt: completed ? new Date().toISOString() : userData.progress[moduleId]?.[topicId]?.completedAt
          }
        }
      };
      const updatedTotalScore = completed 
        ? userData.totalScore + (userData.progress[moduleId]?.[topicId]?.score ? 0 : score)
        : userData.totalScore;
      const updatedLastActiveLesson = { moduleId, topicId };

      const response = await fetch(`http://localhost:5000/api/users/${currentUser.uid}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          progress: updatedProgress,
          totalScore: updatedTotalScore,
          lastActiveLesson: updatedLastActiveLesson
        })
      });

      if (!response.ok) {
        console.error('Failed to update progress:', await response.text());
        return;
      }

      setUserData({
        ...userData,
        progress: updatedProgress,
        totalScore: updatedTotalScore,
        lastActiveLesson: updatedLastActiveLesson
      });
    } catch (error: any) {
      console.error('Error updating progress:', error);
    }
  };

  const value = {
    userData,
    updateUserProgress,
    setSelectedAvatar,
    loading,
    refreshUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}