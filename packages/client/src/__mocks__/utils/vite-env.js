// Mock for vite-env in tests
export const viteEnv = {
  DEV: 'true',
  VITE_API_URL: 'http://localhost:3000',
  VITE_ENABLE_ORGANIZATIONS: 'true',
  VITE_ORG_MODE: 'mock',
  ...globalThis.__IMETA?.env
};
