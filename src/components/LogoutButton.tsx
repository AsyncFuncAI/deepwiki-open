"use client";

import { useMsal } from "@azure/msal-react";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ className = "" }) => {
  const { instance } = useMsal();

  return (
    <button
      onClick={() => instance.logoutRedirect()}
      className={`inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition duration-150 shadow text-sm ${className}`}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
};
