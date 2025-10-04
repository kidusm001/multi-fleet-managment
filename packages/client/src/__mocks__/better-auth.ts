// Mock for better-auth to avoid Request/Response issues in tests
export const createAuthClient = jest.fn(() => ({
  signIn: {
    email: jest.fn(),
    social: jest.fn(),
  },
  signUp: {
    email: jest.fn(),
  },
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    isPending: false,
    error: null,
  })),
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
}));

export const useSession = jest.fn(() => ({
  data: null,
  isPending: false,
  error: null,
}));
