// Provide a minimal shim for import.meta.env access inside tests.
// We store values under globalThis.__IMETA.env so runtime helper can read them.
if (!globalThis.__IMETA) {
  globalThis.__IMETA = { env: {} };
}
// Default flags to disabled unless tests set them.
globalThis.__IMETA.env.VITE_ENABLE_ORGANIZATIONS = globalThis.__IMETA.env.VITE_ENABLE_ORGANIZATIONS || 'true';
globalThis.__IMETA.env.VITE_ORG_MODE = globalThis.__IMETA.env.VITE_ORG_MODE || 'mock';

// crypto.randomUUID polyfill for jsdom if absent
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = { randomUUID: () => 'uuid-' + Math.random().toString(16).slice(2) };
} else if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => 'uuid-' + Math.random().toString(16).slice(2);
}
