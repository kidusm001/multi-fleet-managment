import React from "react";
import ShuttlePage from "./components/ShuttlePage";
import { useTheme } from "@/contexts/ThemeContext";

export default function ShuttleManagement() {
  const { theme } = useTheme();

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <ShuttlePage />
      </div>
    </div>
  );
}
