import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@lib/utils";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { authClient } from "@lib/auth-client";
import { useTheme } from "@contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface UserDropdownProps {
  username: string;
  email: string;
  role?: string;
}

// User button styles as CSS variables in a style tag (no external dependency)
const UserButtonCss = ({ theme }: { theme: string }) => {
  const isDarkMode = theme === 'dark';
  
  const styles = `
    :root {
      --text-color: ${isDarkMode ? '#e5e5e5' : '#000'};
      --bg-color-sup: ${isDarkMode ? '#4b5563' : '#d2d2d2'};
      --bg-color: ${isDarkMode ? '#1f2937' : '#f4f4f4'};
      --bg-hover-color: ${isDarkMode ? '#374151' : '#ffffff'};
      --online-status: #00da00;
      --font-size: 14px;
      --btn-transition: all 0.2s ease-out;
      --role-color: #3b82f6;
    }

    .button-user {
      display: flex;
      justify-content: center;
      align-items: center;
      font: 400 var(--font-size) Helvetica Neue, sans-serif;
      box-shadow: 0 0 2px rgba(0,0,0,.049),0 1px 5px rgba(0,0,0,.07),0 2px 10px rgba(0,0,0,.091),0 10px 30px rgba(0,0,0,.14);
      background-color: var(--bg-color);
      border-radius: 50px;
      cursor: pointer;
      padding: 4px 8px 4px 4px;
      width: fit-content;
      height: 32px;
      border: 0;
      overflow: hidden;
      position: relative;
      transition: var(--btn-transition);
    }

    .button-user:hover {
      height: 48px;
      padding: 6px 16px 6px 6px;
      background-color: var(--bg-hover-color);
      transition: var(--btn-transition);
    }

    .button-user:active {
      transform: scale(0.97);
    }

    .content-avatar {
      width: 24px;
      height: 24px;
      margin: 0;
      transition: var(--btn-transition);
      position: relative;
    }

    .button-user:hover .content-avatar {
      width: 36px;
      height: 36px;
    }

    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      background-color: var(--bg-color-sup);
    }

    .user-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      fill: ${isDarkMode ? '#e5e5e5' : '#000'};
      padding: 1px;
    }

    .status-user {
      position: absolute;
      width: 5px;
      height: 5px;
      right: 0px;
      bottom: 0px;
      border-radius: 50%;
      outline: solid 2px var(--bg-color);
      background-color: var(--online-status);
      transition: var(--btn-transition);
      animation: active-status 2s ease-in-out infinite;
    }

    .button-user:hover .status-user {
      width: 8px;
      height: 8px;
      right: 0px;
      bottom: 0px;
      outline: solid 2px var(--bg-hover-color);
    }

    .notice-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding-left: 6px;
      text-align: initial;
      color: var(--text-color);
    }

    .username {
      letter-spacing: -6px;
      height: 0;
      opacity: 0;
      font-size: 13px;
      transform: translateY(-20px);
      transition: var(--btn-transition);
    }

    .user-id {
      font-size: 11px;
      letter-spacing: -6px;
      height: 0;
      opacity: 0;
      transform: translateY(10px);
      transition: var(--btn-transition);
    }

    .label-role {
      display: flex;
      align-items: center;
      opacity: 1;
      transform: scaleY(1);
      font-size: 13px;
      transition: var(--btn-transition);
    }

    .button-user:hover .username {
      height: auto;
      letter-spacing: normal;
      opacity: 1;
      transform: translateY(0);
      transition: var(--btn-transition);
    }

    .button-user:hover .user-id {
      height: auto;
      letter-spacing: normal;
      opacity: 1;
      transform: translateY(0);
      transition: var(--btn-transition);
    }

    .button-user:hover .label-role {
      height: 0;
      transform: scaleY(0);
      transition: var(--btn-transition);
    }

    .label-role, .username {
      font-weight: 600;
    }

    .role-badge {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      margin-left: 6px;
      font-size: 10px;
      width: 14px;
      height: 14px;
      background-color: var(--role-color);
      color: white;
      border-radius: 20px;
    }
    
    .button-user:hover .chevron {
      transform: rotate(90deg); // Changed to rotate downward
      opacity: 1;
    }
    
    .chevron {
      margin-left: 4px;
      opacity: 0;
      transform: rotate(-90deg); // Start rotated up
      transition: var(--btn-transition);
    }

    /* Add dropdown menu item hover effects */
    .dropdown-item {
      position: relative;
      overflow: hidden;
      margin: 4px;
      border-radius: 6px;
    }

    .dropdown-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 0;
      background-color: var(--role-color);
      opacity: 0.1;
      transition: width 0.2s ease-in-out;
      border-radius: inherit;
    }

    .dropdown-item:hover::before {
      width: 100%;
    }

    @keyframes active-status {
      0% {
        background-color: var(--online-status);
      }

      33.33% {
        background-color: #93e200;
      }

      66.33% {
        background-color: #93e200;
      }

      100% {
        background-color: var(--online-status);
      }
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
};

const UserButton = ({ username, email, role }: { username: string; email: string; role?: string }) => {
  const roleLabel = React.useMemo(() => {
    const raw = (role ?? '').toString();
    if (!raw) return 'User';
    const upper = raw.toUpperCase();
    const map: Record<string, string> = {
      ADMIN: 'Admin',
      ADMINISTRATOR: 'Administrator',
      MANAGER: 'Manager',
      FLEET_MANAGER: 'Fleet Manager',
      FLEETMANAGER: 'Fleet Manager',
      FLEET: 'Fleet',
      USER: 'User'
    };
    if (map[upper]) return map[upper];
    // Fallback: title-case and replace underscores
    return raw
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [role]);

  return (
    <button className="button-user">
      <div className="content-avatar">
        <div className="status-user"></div>
        <div className="avatar">
          <svg className="user-img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12,12.5c-3.04,0-5.5,1.73-5.5,3.5s2.46,3.5,5.5,3.5,5.5-1.73,5.5-3.5-2.46-3.5-5.5-3.5Zm0-.5c1.66,0,3-1.34,3-3s-1.34-3-3-3-3,1.34-3,3,1.34,3,3,3Z"></path>
          </svg>
        </div>
      </div>
      <div className="notice-content">
        <div className="username">{username}</div>
        <div className="label-role">
          {roleLabel}<span className="role-badge">{roleLabel ? roleLabel.charAt(0) : 'U'}</span>
        </div>
        <div className="user-id">{email}</div>
      </div>
      <ChevronDown size={14} className="chevron" />
    </button>
  );
};

export function UserDropdown({ username, email, role }: UserDropdownProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
  await authClient.signOut();
  navigate("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleProfileClick = () => {
    navigate("/profile");
    setIsOpen(false);
  };
  
  const handleSettingsClick = () => {
    navigate("/settings");
    setIsOpen(false);
  };

  return (
    <>
      <UserButtonCss theme={theme} />
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div>
            <UserButton username={username} email={email} role={role} />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className={cn(
            "w-56",
            isDarkMode 
              ? "bg-gray-900 border-gray-800" 
              : "bg-white border-gray-200",
            "mt-2 shadow-lg", // Increased margin-top
            "animate-in fade-in-80 slide-in-from-top-1 duration-100",
            "p-2" // Added padding to the container
          )}
          align="end"
          sideOffset={8} // Increased offset
        >
          {/* Profile Item */}
          <DropdownMenuItem
            onClick={handleProfileClick}
            className={cn(
              "dropdown-item flex items-center gap-3 px-4 py-3 text-sm transition-all", // Increased padding and gap
              "relative cursor-pointer",
              isDarkMode 
                ? "text-gray-300 hover:text-blue-300 focus:text-blue-300" 
                : "text-gray-700 hover:text-blue-600 focus:text-blue-600",
              "group hover:pl-5 active:scale-98" // Adjusted hover padding
            )}
          >
            <div className={cn(
              "absolute left-0 top-[10%] w-1 h-[80%] rounded-full bg-blue-500",
              "opacity-0 transition-all duration-200 scale-50",
              "group-hover:opacity-100 group-hover:scale-100"
            )} />
            <User className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="font-medium">Profile</span>
          </DropdownMenuItem>

          {/* Settings Item */}
          <DropdownMenuItem
            onClick={handleSettingsClick}
            className={cn(
              "dropdown-item flex items-center gap-3 px-4 py-3 text-sm transition-all", // Increased padding and gap
              "relative cursor-pointer",
              isDarkMode 
                ? "text-gray-300 hover:text-blue-300 focus:text-blue-300" 
                : "text-gray-700 hover:text-blue-600 focus:text-blue-600",
              "group hover:pl-5 active:scale-98" // Adjusted hover padding
            )}
          >
            <div className={cn(
              "absolute left-0 top-[10%] w-1 h-[80%] rounded-full bg-blue-500",
              "opacity-0 transition-all duration-200 scale-50",
              "group-hover:opacity-100 group-hover:scale-100"
            )} />
            <Settings className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:rotate-12" />
            <span className="font-medium">Settings</span>
          </DropdownMenuItem>

          {/* Logout Item */}
          <DropdownMenuItem
            onClick={handleLogout}
            className={cn(
              "dropdown-item flex items-center gap-3 px-4 py-3 text-sm transition-all", // Increased padding and gap
              "relative cursor-pointer",
              isDarkMode 
                ? "text-red-300 hover:text-red-200 focus:text-red-200" 
                : "text-red-600 hover:text-red-700 focus:text-red-700",
              "group hover:pl-5 active:scale-98" // Adjusted hover padding
            )}
          >
            <div className={cn(
              "absolute left-0 top-[10%] w-1 h-[80%] rounded-full bg-red-500",
              "opacity-0 transition-all duration-200 scale-50",
              "group-hover:opacity-100 group-hover:scale-100"
            )} />
            <LogOut className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:-translate-x-0.5" />
            <span className="font-medium">Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

