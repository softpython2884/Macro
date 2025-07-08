
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/data';
import { INITIAL_USERS } from '@/lib/data';
import { useRouter } from 'next/navigation';

const USERS_KEY = 'macro-users';

type UserContextType = {
  users: User[];
  currentUser: User | null;
  login: (user: User, pin?: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem(USERS_KEY);
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        setUsers(INITIAL_USERS);
        localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      }
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
      setUsers(INITIAL_USERS);
    }
  }, []);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
  };

  const login = (user: User, pin?: string): boolean => {
    if (user.pin && user.pin !== pin) {
      return false;
    }
    setCurrentUser(user);
    // Do not push route here, let the caller handle it.
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const userWithId = {
      ...newUser,
      id: `user-${Date.now()}`,
      avatar: newUser.avatar || 'https://icon-library.com/images/netflix-icon-black/netflix-icon-black-19.jpg',
    };
    saveUsers([...users, userWithId]);
  };

  const updateUser = (updatedUser: User) => {
    const newUsers = users.map(user => user.id === updatedUser.id ? updatedUser : user);
    saveUsers(newUsers);
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const deleteUser = (userId: string) => {
    if (users.length <= 1) {
        console.warn("Cannot delete the last user.");
        return;
    }
    if (currentUser?.id === userId) {
        logout();
    }
    const newUsers = users.filter(user => user.id !== userId);
    saveUsers(newUsers);
  };
  
  const value = { users, currentUser, login, logout, addUser, updateUser, deleteUser };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
