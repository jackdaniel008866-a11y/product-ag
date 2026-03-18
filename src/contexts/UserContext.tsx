/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface UserContextType {
  users: Record<string, User>;
  usersList: User[];
  addUser: (name: string, initials: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [usersList, setUsersList] = useState<User[]>([]);

  useEffect(() => {
    supabase.from('users').select('*')
      .then(({ data, error }) => {
        if (error) console.error('Error fetching users:', error);
        else setUsersList(data || []);
      });
  }, []);

  const users = usersList.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, User>);

  const addUser = async (name: string, initials: string) => {
    const id = `u${Date.now()}`;
    const newUser = { id, name, initials };
    
    const { error } = await supabase.from('users').insert([newUser]);
    if (!error) {
      setUsersList(prev => [...prev, newUser]);
    } else {
      console.error('Error adding user:', error);
    }
  };

  const removeUser = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      setUsersList(prev => prev.filter(u => u.id !== id));
    } else {
      console.error('Error removing user:', error);
    }
  };

  return (
    <UserContext.Provider value={{ users, usersList, addUser, removeUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUsers must be used within UserProvider');
  return context;
};
