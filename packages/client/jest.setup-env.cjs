// Provide a minimal shim for import.meta.env access inside tests.
// We store values under globalThis.__IMETA.env so runtime helper can read them.
if (!globalThis.__IMETA) {
  globalThis.__IMETA = { env: {} };
}
// Default flags to disabled unless tests set them.
globalThis.__IMETA.env.VITE_ENABLE_ORGANIZATIONS = globalThis.__IMETA.env.VITE_ENABLE_ORGANIZATIONS || 'true';
globalThis.__IMETA.env.VITE_ORG_MODE = globalThis.__IMETA.env.VITE_ORG_MODE || 'mock';
// Provide generic API base defaults for tests referencing import.meta.env
globalThis.__IMETA.env.VITE_API_BASE = globalThis.__IMETA.env.VITE_API_BASE || 'http://localhost:3001';
globalThis.__IMETA.env.VITE_API_URL = globalThis.__IMETA.env.VITE_API_URL || 'http://localhost:3001';
globalThis.__IMETA.env.DEV = 'true';

// Polyfill fetch / Request / Response / Headers using undici (recommended modern fetch impl for Node)
try {
  const { fetch, Headers, Request, Response } = require('undici');
  if (typeof globalThis.fetch === 'undefined') globalThis.fetch = fetch;
  if (typeof globalThis.Headers === 'undefined') globalThis.Headers = Headers;
  if (typeof globalThis.Request === 'undefined') globalThis.Request = Request;
  if (typeof globalThis.Response === 'undefined') globalThis.Response = Response;
} catch (e) {
  // undici not available; tests depending on fetch may fail explicitly
}

// crypto.randomUUID polyfill for jsdom if absent
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = { randomUUID: () => 'uuid-' + Math.random().toString(16).slice(2) };
} else if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => 'uuid-' + Math.random().toString(16).slice(2);
}
