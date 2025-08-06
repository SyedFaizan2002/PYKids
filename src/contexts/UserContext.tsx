import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { auth } from '../firebase/config';

export interface Avatar {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  color: string;
  personality: string;
}

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
  setSelectedAvatar: (avatar: Avatar) => Promise<void>;
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
        totalScore: 0
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

  const setSelectedAvatar = async (avatar: Avatar) => {
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    // Optimistically update local state
    setUserData(prev => prev ? { ...prev, selectedAvatar: avatar.id } : null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.error('Failed to get authentication token');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/${currentUser.uid}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ selectedAvatar: avatar.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save avatar:', errorData.error || 'Unknown error');
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

  const updateUserProgress = async (moduleId: string, topicId: string, completed: boolean, score?: number) => {
    if (!currentUser || !userData) return;

    console.log('Tracking lesson completion:', { moduleId, topicId, completed, score });

    const existingProgress = userData.progress[moduleId]?.[topicId];
    const isNewCompletion = completed && !existingProgress?.completed;

    const newProgress = {
      ...userData.progress,
      [moduleId]: {
        ...userData.progress[moduleId],
        [topicId]: {
          completed,
          score: score || existingProgress?.score || 0,
          completedAt: completed ? new Date().toISOString() : existingProgress?.completedAt
        }
      }
    };

    const scoreToAdd = isNewCompletion ? (score || 0) : 0;

    const newUserData = {
      ...userData,
      progress: newProgress,
      totalScore: userData.totalScore + scoreToAdd,
      lastActiveLesson: {
        moduleId,
        topicId
      }
    };

    setUserData(newUserData);

    console.log('TODO: Update progress on backend:', newUserData);
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