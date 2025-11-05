import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

const ThemeToggle = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center cursor-pointer transition-all duration-300",
        compact 
          ? "w-8 h-8 rounded-full" 
          : "w-12 md:w-9 h-9 rounded-full",
        isDarkMode 
          ? "bg-gray-800 hover:bg-gray-700 shadow-md border border-gray-700" 
          : "bg-white hover:bg-gray-50 shadow-sm border border-border",
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "transform-style-preserve-3d transform-perspective-800",
        "active:scale-95",
        !compact && "hover:[&>svg]:rotate-15 hover:[&>svg]:scale-110"
      )}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className={cn(
          "transition-all duration-300 rotate-0 scale-100",
          compact ? "h-3.5 w-3.5" : "h-4 w-4",
          isDarkMode ? "text-gray-200" : "text-gray-600"
        )} />
      ) : (
        <Moon className={cn(
          "transition-all duration-300 rotate-0 scale-100",
          compact ? "h-3.5 w-3.5" : "h-4 w-4",
          isDarkMode ? "text-gray-200" : "text-gray-600"
        )} />
      )}

  <style>{`
        button {
          transform-style: preserve-3d;
          transform: perspective(800px);
        }
        
        button:active {
          transform: scale(0.95) perspective(800px);
        }

/*         button:hover svg {
          transform: rotate(15deg) scale(1.1);
        } */
      `}</style>
    </button>
  );
};

ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;