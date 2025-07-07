'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@/lib/data';
import { INITIAL_USERS } from '@/lib/data';
import { useRouter } from 'next/navigation';

type UserContextType = {
  users: User[];
  currentUser: User | null;
  login: (user: User, pin?: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'avatar'> & { avatar?: string }) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  const login = (user: User, pin?: string): boolean => {
    if (user.pin && user.pin !== pin) {
      console.error("Incorrect PIN");
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

  const addUser = (newUser: Omit<User, 'id' | 'avatar'> & { avatar?: string }) => {
    const userWithId = { 
        ...newUser, 
        id: `user-${Date.now()}`,
        avatar: newUser.avatar || 'https://icon-library.com/images/netflix-icon-black/netflix-icon-black-19.jpg',
    };
    setUsers(prevUsers => [...prevUsers, userWithId]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
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
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
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
