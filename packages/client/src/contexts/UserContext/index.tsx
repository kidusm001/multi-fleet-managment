import { createContext, useContext, useEffect, useState } from "react";

interface SessionResponse {
  session: {
    id: string;
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string;
    userAgent: string;
    userId: string;
    impersonatedBy: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    role: string;
    banned: boolean | null;
    banReason: string | null;
    banExpires: string | null;
  };
}

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
      
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const response = await fetch(`${base}/api/auth/get-session`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Raw Response:', response); // Debug log

      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.status}`);
      }

      const responseText = await response.text(); // Get raw response text
      console.log('Raw Response Text:', responseText); // Debug log

      const data = JSON.parse(responseText) as SessionResponse;
      console.log('Parsed Session Data:', data); // Debug log

      if (data?.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          emailVerified: data.user.emailVerified,
          name: data.user.name,
          createdAt: new Date(data.user.createdAt),
          updatedAt: new Date(data.user.updatedAt),
          image: data.user.image,
          banned: data.user.banned,
          role: data.user.role,
          banReason: data.user.banReason ?? undefined,
          banExpires: data.user.banExpires ? new Date(data.user.banExpires) : undefined
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