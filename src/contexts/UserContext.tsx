import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface UserContextType {
  user: User | null;
  userName: string;
  updateUserName: (name: string) => void;
  isAdmin: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('Student');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Determine user role based on email
        const userRole = (firebaseUser.email === 'admin@example.com' || firebaseUser.email === 'aiedustudents@gmail.com') ? 'admin' : 'student';
        const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        
        setUserName(displayName);
        setIsAdmin(userRole === 'admin');
        
        // Store user data in localStorage for compatibility
        localStorage.setItem('userData', JSON.stringify({
          email: firebaseUser.email,
          name: displayName,
          role: userRole,
          uid: firebaseUser.uid
        }));
      } else {
        setUserName('Student');
        setIsAdmin(false);
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
    <UserContext.Provider value={{ user, userName, updateUserName, isAdmin, loading }}>
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
