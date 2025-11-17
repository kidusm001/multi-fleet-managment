/**
 * Organization feature flags
 */

/**
 * Check if organizations feature is enabled
 * @returns {boolean} true if organizations are enabled
 */
export function orgsEnabled(): boolean {
  // Organizations are always enabled with better-auth
  return true;
}

/**
 * Check if dynamic roles feature is enabled
 * @returns {boolean} true if dynamic roles are enabled
 */
export function dynamicRolesEnabled(): boolean {
  // Dynamic roles are disabled for now as they're not yet implemented
  return false;
}

/**
 * Check if teams feature is enabled
 * @returns {boolean} true if teams are enabled
 */
export function teamsEnabled(): boolean {
  // Teams are disabled for now as they're not yet implemented
  return false;
}