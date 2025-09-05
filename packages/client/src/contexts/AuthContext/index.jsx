import { createContext, useContext } from 'react';
import { authClient } from '@/lib/auth-client';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  signup: () => {},
  loginWithEmail: () => {},
  // Organization methods
  createOrganization: () => {},
  switchOrganization: () => {},
  inviteMember: () => {},
  // Admin methods
  admin: () => {},
});

export function AuthProvider({ children }) {
  const session = authClient.useSession();

  const login = async ({ email, password }) => {
    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    return result;
  };

  const signup = async ({ email, password, name }) => {
    const result = await authClient.signUp.email({
      email: email.trim(),
      password,
      name: name?.trim(),
    });
    return result;
  };

  const logout = async () => {
    return await authClient.signOut();
  };

  const loginWithEmail = async (_email) => {
    return { success: false, error: 'Magic link login not implemented' };
  };

  // Organization methods
  const createOrganization = async (name) => {
    return await authClient.organization.create({
      name,
    });
  };

  const switchOrganization = async (organizationId) => {
    return await authClient.organization.setActive({
      organizationId,
    });
  };

  const inviteMember = async (email, role) => {
    return await authClient.organization.inviteMember({
      email,
      role,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session.data,
        user: session.data?.user,
        login,
        logout,
        signup,
        loginWithEmail,
        createOrganization,
        switchOrganization,
        inviteMember,
        admin: authClient.admin,
        isLoading: session.isPending
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
