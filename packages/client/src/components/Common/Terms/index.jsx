import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@components/Common/UI/Button";
import { useTheme } from "@contexts/ThemeContext";

const Terms = ({ isOpen, onClose, onAccept }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto py-10"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`${
            isDark ? "bg-[#324048]" : "bg-white"
          } rounded-3xl p-8 w-full max-w-2xl mx-auto my-auto sticky top-10 shadow-2xl border ${
            isDark ? "border-white/10" : "border-black/10"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            } mb-6`}
          >
            Terms & Conditions
          </h2>
          <div
            className={`space-y-6 ${
              isDark ? "text-white/80" : "text-gray-600"
            }`}
          >
            <p className="text-lg leading-relaxed">
              Welcome to ShuttleOps - Enterprise Transportation Management
              System
            </p>

            <div>
              <h3
                className={`text-xl font-semibold bg-gradient-to-r ${
                  isDark ? "from-white" : "from-gray-900"
                } to-[#f3684e] bg-clip-text text-transparent mb-3`}
              >
                Enterprise Transportation Management
              </h3>
              <p className="mb-3 leading-relaxed">
                Our enterprise solution provides comprehensive features designed
                for large-scale operations:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Advanced fleet tracking and management system</li>
                <li>Enterprise-grade route optimization algorithms</li>
                <li>Comprehensive employee management</li>
                <li>Real-time analytics and reporting</li>
                <li>Role-based access control</li>
                <li>Secure data management</li>
                <li>Custom integration capabilities</li>
                <li>Automated scheduling system</li>
                <li>Multi-department support</li>
                <li>Audit trail and compliance features</li>
              </ul>
            </div>

            <div>
              <h3
                className={`text-xl font-semibold bg-gradient-to-r ${
                  isDark ? "from-white" : "from-gray-900"
                } to-[#f3684e] bg-clip-text text-transparent mb-3`}
              >
                Security & Compliance
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Enterprise-grade data encryption</li>
                <li>Regular security audits and updates</li>
                <li>Compliance with industry standards</li>
                <li>Secure authentication system</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            {onAccept ? (
              <Button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="relative overflow-hidden group bg-gradient-to-r from-[#f3684e] to-[#f3684e]/80 hover:from-[#f3684e]/90 hover:to-[#f3684e]/70 text-white py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Accept & Continue
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="relative overflow-hidden group bg-gradient-to-r from-[#f3684e] to-[#f3684e]/80 hover:from-[#f3684e]/90 hover:to-[#f3684e]/70 text-white py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Close
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Terms;
