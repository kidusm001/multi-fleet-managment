import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import AIChat from './AIChat';

interface AIAssistantButtonProps {
  userRole?: string;
  className?: string;
  isAbovePanel?: boolean;
  isPanelExpanded?: boolean;
}

const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ 
  userRole = 'user',
  className = '',
  isAbovePanel: propIsAbovePanel,
  isPanelExpanded: propIsPanelExpanded
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  
  // Check if we're on the dashboard page (desktop only positioning logic)
  const isDashboardPage = location.pathname === '/' || location.pathname === '/dashboard';
  
  // Detect if RouteDetails panel is expanded by checking its computed height
  React.useEffect(() => {
    if (!isDashboardPage) return;
    
    const checkPanelState = () => {
      // Only check on desktop (lg breakpoint)
      if (window.innerWidth < 1024) return;
      
      const panel = document.querySelector('[class*="RouteDetails"]');
      if (!panel) {
        const routeDetailsDiv = Array.from(document.querySelectorAll('div')).find(
          (el) => el.textContent?.includes('Route Details') && el.className.includes('absolute')
        );
        if (routeDetailsDiv) {
          const height = routeDetailsDiv.offsetHeight;
          setIsExpanded(height > 100); // Expanded if height > 100px
        }
      } else {
        const height = (panel as HTMLElement).offsetHeight;
        setIsExpanded(height > 100);
      }
    };
    
    checkPanelState();
    const observer = new MutationObserver(checkPanelState);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    return () => observer.disconnect();
  }, [isDashboardPage]);
  
  // On dashboard, always position above the RouteDetails panel (which is always present at bottom-right)
  // Use props if provided (for future Dashboard-specific state awareness), otherwise use page detection
  const isAbovePanel = propIsAbovePanel !== undefined ? propIsAbovePanel : isDashboardPage;
  const isPanelExpanded = propIsPanelExpanded !== undefined ? propIsPanelExpanded : isExpanded;

  // Calculate position based on RouteDetails state
  // No panel: bottom-6
  // Panel collapsed (48px): bottom-[72px] (48px + 24px spacing)
  // Panel expanded (500px): bottom-[524px] (500px + 24px spacing)
  const getButtonPosition = () => {
    if (!isAbovePanel) return "bottom-6 right-6";
    if (isPanelExpanded) return "bottom-[524px] right-6";
    return "bottom-[72px] right-6";
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className={cn(
          "fixed z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 items-center justify-center group",
          getButtonPosition(),
          isChatOpen ? 'hidden' : 'flex',
          className
        )}
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI Assistant
        </div>
      </button>

      {/* Chat Component */}
      <AIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        userRole={userRole}
        isAbovePanel={isAbovePanel}
        isPanelExpanded={isPanelExpanded}
      />
    </>
  );
};

export default AIAssistantButton;
