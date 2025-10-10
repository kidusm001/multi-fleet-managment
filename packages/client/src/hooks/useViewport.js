import { useState, useEffect } from 'react';

/**
 * Custom hook to detect current viewport size
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState('mobile');

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setViewport('mobile');
      } else if (width < 1024) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return viewport;
};
