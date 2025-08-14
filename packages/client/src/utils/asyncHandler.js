/**
 * Wraps an async function to handle errors consistently
 * @param {Function} fn - The async function to wrap
 * @returns {Function} The wrapped function
 */
export const AsyncHandler = (fn) => {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      // Log the error for debugging
      console.error('API Error:', error);
      
      // Format the error message
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      
      // Throw a formatted error
      throw new Error(errorMessage);
    }
  };
};