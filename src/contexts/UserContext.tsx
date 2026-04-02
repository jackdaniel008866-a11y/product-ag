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

  // Deduplicate users by name so dropdowns don't show multiples
  const uniqueUsersList = usersList.filter((user, index, self) =>
    index === self.findIndex((t) => t.name === user.name)
  );

  // Map user IDs properly
  let users = usersList.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, User>);

  // Self-heal known generic legacy mapping
  // Map hardcoded 'ownerId' missing from DB directly to discovered authenticated active federated users
  const legacyToName: Record<string, string> = {
    'u1': 'Sahil Asgher', 
    'u2': 'Deepjyoti Patar',
    'u3': 'Rajneesh Lakhera',
    'u4': 'Nitin Verma'
  };
  
  Object.keys(legacyToName).forEach(legacyId => {
     // Find the real UUID user instance for that name
     const trueUser = usersList.find(u => u.name === legacyToName[legacyId]);
     if (trueUser) {
        users[legacyId] = trueUser;
     }
  });

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
    <UserContext.Provider value={{ users, usersList: uniqueUsersList, addUser, removeUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUsers must be used within UserProvider');
  return context;
};
