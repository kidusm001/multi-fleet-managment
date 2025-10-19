import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import AIChat from './AIChat';

interface AIAssistantButtonProps {
  userRole?: string;
  className?: string;
}

const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ 
  userRole = 'user',
  className = '' 
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${className} ${
          isChatOpen ? 'hidden' : 'flex'
        } items-center justify-center group`}
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
      />
    </>
  );
};

export default AIAssistantButton;
