import { useEffect } from 'react';

/**
 * Hook that alerts when you click outside of the specified elements
 * @param {Array} refs Array of refs to check against
 * @param {Function} callback Function to call when click is outside
 */
export const useClickOutside = (refs, callback) => {
    useEffect(() => {
        /**
         * Alert if clicked outside of elements
         */
        function handleClickOutside(event) {
            // Check if any of the refs contain the target
            const isOutside = refs.every(ref => {
                return ref.current && !ref.current.contains(event.target);
            });

            if (isOutside) {
                callback();
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [refs, callback]);
}; 