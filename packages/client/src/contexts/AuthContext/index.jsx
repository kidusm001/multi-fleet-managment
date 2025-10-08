import { createContext, useContext, useState, useEffect } from 'react';
import { authClient, useSession } from '@/lib/auth-client';

const AuthContext = createContext(/** @type {{
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithFayda: (callbackURL?: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}} */ ({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  loginWithEmail: () => {},
  loginWithFayda: () => {},
}));

export function AuthProvider({ children }) {
  const { data: session, isPending } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(/** @type {User | null} */ null);

  useEffect(() => {
    if (session) {
      setUser(session.user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [session]);

  const login = async ({ email, password }) => {
    try {
      // Simplify the payload structure
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password: password,
        callbackURL: '/',
        rememberMe: true,
      });

      if (error) {
        console.error('Auth error:', error);
        return { success: false, error: error.message };
      }

      if (!data?.user) {
        return { success: false, error: 'No user data received' };
      }

      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'An error occurred during login' };
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithEmail = async (email) => {
    try {
      const { error } = await authClient.signIn.magicLink({
        email,
        redirectUrl: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithFayda = async (callbackURL = '/') => {
    try {
      await authClient.signIn.oauth2({
        providerId: 'fayda',
        callbackURL
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to sign in with Fayda' };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout, 
        loginWithEmail,
        loginWithFayda,
        isLoading: isPending 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
