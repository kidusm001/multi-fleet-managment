import { createContext, useContext, useState, useEffect } from 'react';
import { authClient, useSession } from '@/lib/auth-client';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  loginWithEmail: () => {},
});

export function AuthProvider({ children }) {
  const { data: session, isPending } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

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
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password: password,
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

  const loginWithEmail = async (_email) => {
    // This functionality is not implemented in the backend yet
    return { success: false, error: 'Magic link login not implemented' };
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout, 
        loginWithEmail,
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
