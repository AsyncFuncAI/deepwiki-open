"use client";

import { useMsal } from "@azure/msal-react";
import { LogIn } from "lucide-react";

export const LoginButton = () => {
  const { instance } = useMsal();

  return (
    <button
      onClick={() => instance.loginRedirect()}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition duration-150 shadow"
    >
      <LogIn className="w-4 h-4" />
      Sign In
    </button>
  );
};
