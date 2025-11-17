// Environment variable helper that works in both Vite and Jest
import { viteEnv } from './vite-env';

export const getEnv = (key, defaultValue = undefined) => {
  return viteEnv[key] !== undefined ? viteEnv[key] : defaultValue;
};

export const isDev = () => {
  const dev = getEnv('DEV');
  return dev === 'true' || dev === true;
};

export const getApiUrl = () => getEnv('VITE_API_URL', 'http://localhost:3000');
