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
// Map configuration defaults
globalThis.__IMETA.env.VITE_HQ_NAME = 'Routegna (HQ)';
globalThis.__IMETA.env.VITE_HQ_LONGITUDE = '38.76';
globalThis.__IMETA.env.VITE_HQ_LATITUDE = '9.03';
globalThis.__IMETA.env.VITE_MAP_DEFAULT_ZOOM = '12';
globalThis.__IMETA.env.VITE_MAP_MAX_ZOOM = '19';
globalThis.__IMETA.env.VITE_MAP_MIN_ZOOM = '10';

// Polyfill TextEncoder/TextDecoder and Web Streams API for undici
const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream, WritableStream, TransformStream } = require('stream/web');

if (typeof globalThis.TextEncoder === 'undefined') globalThis.TextEncoder = TextEncoder;
if (typeof globalThis.TextDecoder === 'undefined') globalThis.TextDecoder = TextDecoder;
if (typeof globalThis.ReadableStream === 'undefined') globalThis.ReadableStream = ReadableStream;
if (typeof globalThis.WritableStream === 'undefined') globalThis.WritableStream = WritableStream;
if (typeof globalThis.TransformStream === 'undefined') globalThis.TransformStream = TransformStream;

// Polyfill fetch / Request / Response / Headers using undici (recommended modern fetch impl for Node)
const { fetch, Headers, Request, Response, FormData } = require('undici');
if (typeof globalThis.fetch === 'undefined') globalThis.fetch = fetch;
if (typeof globalThis.Headers === 'undefined') globalThis.Headers = Headers;
if (typeof globalThis.Request === 'undefined') globalThis.Request = Request;
if (typeof globalThis.Response === 'undefined') globalThis.Response = Response;
if (typeof globalThis.FormData === 'undefined') globalThis.FormData = FormData;

// crypto.randomUUID polyfill for jsdom if absent
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = { randomUUID: () => 'uuid-' + Math.random().toString(16).slice(2) };
} else if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => 'uuid-' + Math.random().toString(16).slice(2);
}

// Mock window.matchMedia for tests
/* global jest */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
