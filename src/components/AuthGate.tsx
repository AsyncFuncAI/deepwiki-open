"use client";

import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useState } from "react";
import { AuthInit } from "./AuthInit";
import { LoginButton } from "./LoginButton";
import { LogoutButton } from "./LogoutButton";
import { Loader2, ShieldAlert } from "lucide-react";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = loading
  const { accounts } = useMsal();

  return (
    <>
      <AuthInit setIsAuthorized={setIsAuthorized} />

      <AuthenticatedTemplate>
        {isAuthorized === null ? (
          <div className="flex flex-col items-center justify-center h-[30vh] text-gray-500">
            <Loader2 className="animate-spin h-6 w-6 mb-2" />
            <p className="text-sm">Checking permissions…</p>
          </div>
        ) : isAuthorized ? (
          <div className="space-y-4">
            {children}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4">
            <ShieldAlert className="h-10 w-10 text-red-500" />
            <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
            <p className="text-sm text-gray-500 max-w-md">
              You are signed in, but you're not authorized to access this application.
              Please reach out to Akhil Anand or Ethan McDonald for access. Mumford tenting is a requirement.
            </p>
            <LogoutButton />
          </div>
        )}
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome</h2>
          <p className="text-gray-500 max-w-md">
            Sign in with your Microsoft account to continue.
          </p>
          <LoginButton />
        </div>
      </UnauthenticatedTemplate>
    </>
  );
};
