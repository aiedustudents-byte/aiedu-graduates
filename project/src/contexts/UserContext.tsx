import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  userName: string;
  updateUserName: (name: string) => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState('Student');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Load user data from localStorage on mount
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.name || (user.role === 'admin' ? 'Admin' : 'Student'));
          setIsAdmin(user.role === 'admin');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();

    // Listen for storage changes (when localStorage is updated from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData' && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          setUserName(user.name || (user.role === 'admin' ? 'Admin' : 'Student'));
          setIsAdmin(user.role === 'admin');
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateUserName = (name: string) => {
    setUserName(name);
    
    // Update localStorage
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        user.name = name;
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { name } }));
      }
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userName, updateUserName, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
