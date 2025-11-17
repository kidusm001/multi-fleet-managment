import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  banned: boolean | null;
  role: string;
  banReason?: string;
  banExpires?: Date;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

const defaultContextValue: UserContextType = {
  user: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {}
};

const UserContext = createContext<UserContextType>(defaultContextValue);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = async () => {
    console.log('Fetching session...'); // Debug log
    try {
      setIsLoading(true);
      setError(null);
    const data = await authClient.getSession();
    if (data?.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          emailVerified: false,
          name: data.user.email.split("@")[0] || "User",
          createdAt: new Date(),
          updatedAt: new Date(),
          image: null,
          banned: null,
          role: data.user.role || "user",
          banReason: undefined,
          banExpires: undefined
        };
        
        console.log('Setting user data:', userData); // Debug log
        setUser(userData);
      } else {
        console.log('No user data in response'); // Debug log
        setUser(null);
      }
    } catch (err) {
      console.error('Session fetch error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Add immediate debug logging for state changes
  useEffect(() => {
    console.log('User state changed:', user);
  }, [user]);

  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log('Error state changed:', error);
  }, [error]);

  useEffect(() => {
    fetchSession();
  }, []);

  const value: UserContextType = {
    user,
    isLoading,
    error,
    refreshUser: fetchSession
  };

  return (
    <UserContext.Provider value={value}>
      <div style={{ display: 'none' }}>
        Debug: {isLoading ? 'Loading' : user ? `User: ${user.name}` : 'No user'}
      </div>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;