import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/Common/UI/Button";
import LoadingWrapper from "@components/Common/LoadingAnimation/LoadingWrapper";
import { motion } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import "./Home.css";

const buttonStyles = {
  primary: "relative overflow-hidden group bg-gradient-to-r from-[#f3684e] to-[#f3684e]/80 hover:from-[#f3684e]/90 hover:to-[#f3684e]/70 text-white py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]",
  secondary: "relative overflow-hidden group border border-[#f3684e]/20 hover:border-[#f3684e]/30 bg-white/5 hover:bg-white/10 dark:text-white text-slate-900 py-3.5 px-8 rounded-xl transition-all duration-300",
};

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadingWrapper isLoading={isLoading}>
      <div className={`home-container bg-gradient-to-br ${
        isDark 
          ? 'from-slate-950 via-[#1a2327] to-[#1a2327]' 
          : 'from-gray-50 via-gray-100 to-gray-200'
      }`}>
        {/* Logo Section - Updated light mode background */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12 relative z-10"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 0],
            }}
            transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            className={`relative flex items-center ${
              isDark 
                ? 'bg-white/80' 
                : 'bg-white/90 shadow-lg'
            } backdrop-blur-sm px-4 py-[0.2rem] rounded-[1.5rem]`}
          >
            <img
              src="/assets/images/MMCYTech.png"
              alt="MMCY Tech"
              className="h-12 object-contain"
            />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f3684e] to-transparent"
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-6xl mx-auto"
        >
          <div className={`relative backdrop-blur-xl rounded-[2rem] shadow-2xl border overflow-hidden p-12 ${
            isDark 
              ? 'bg-black/20 border-white/10' 
              : 'bg-white/20 border-black/10'
          }`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${
              isDark 
                ? 'from-[#324048]/5' 
                : 'from-slate-100/50'
            } to-transparent`} />
            
            <div className="relative z-10 text-center">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-6xl font-bold mb-6"
              >
                <span className={`bg-gradient-to-r ${isDark ? 'from-white to-[#f3684e]' : 'from-slate-900 to-[#f3684e]'} bg-clip-text text-transparent`}>
                  Welcome to Shuttle Management
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`text-xl ${isDark ? 'text-white/70' : 'text-slate-900/70'} mb-12 max-w-2xl mx-auto`}
              >
                Transform your transportation operations with our comprehensive fleet management solution.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center space-x-6"
              >
                <Link to="/dashboard">
                  <Button className={buttonStyles.primary}>
                    <span className="relative z-10">Go to Dashboard</span>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f3684e]/0 via-white/10 to-[#f3684e]/0 group-hover:via-white/20 transition-all duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button className={buttonStyles.secondary}>Learn More</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </LoadingWrapper>
  );
}