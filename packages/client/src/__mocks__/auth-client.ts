// Mock auth client for tests
export const authClient = {
  signIn: {
    email: jest.fn(),
    social: jest.fn(),
  },
  signUp: {
    email: jest.fn(),
  },
  signOut: jest.fn(),
  organization: {
    create: jest.fn(),
    listUserOrganizations: jest.fn(),
    setActive: jest.fn(),
  },
  admin: {
    listUsers: jest.fn(),
    banUser: jest.fn(),
    unbanUser: jest.fn(),
  },
};

export const useSession = jest.fn(() => ({
  data: null,
  isPending: false,
  error: null,
}));

export interface User {
  id: string;
  email: string;
  role?: string;
  isSubscribed?: boolean;
}

export interface Session {
  user: User;
}
