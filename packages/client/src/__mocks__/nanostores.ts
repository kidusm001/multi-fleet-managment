// Mock for nanostores to avoid ESM issues in Jest

export const atom = jest.fn((initialValue) => ({
  get: jest.fn(() => initialValue),
  set: jest.fn(),
  subscribe: jest.fn((cb) => {
    cb(initialValue);
    return jest.fn(); // unsubscribe
  }),
  listen: jest.fn(),
}));

export const map = jest.fn((initialValue = {}) => ({
  get: jest.fn(() => initialValue),
  set: jest.fn(),
  setKey: jest.fn(),
  subscribe: jest.fn((cb) => {
    cb(initialValue);
    return jest.fn();
  }),
  listen: jest.fn(),
}));

export const computed = jest.fn((stores, cb) => ({
  get: jest.fn(() => cb()),
  subscribe: jest.fn((callback) => {
    callback(cb());
    return jest.fn();
  }),
}));

export const onMount = jest.fn();
export const onSet = jest.fn();
export const onNotify = jest.fn();
export const onStart = jest.fn();
export const onStop = jest.fn();

export default {
  atom,
  map,
  computed,
  onMount,
  onSet,
  onNotify,
  onStart,
  onStop,
};
