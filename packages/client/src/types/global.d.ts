/* eslint-disable no-var */
export {};

declare global {
  // Used by tests to store an auth session token for cookie header injection
  var __authToken: string | undefined;
}
