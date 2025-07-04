"use client";

import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useState } from "react";
import { AuthInit } from "./AuthInit";
import { LoginButton } from "./LoginButton";
import { LogoutButton } from "./LogoutButton";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);

  return (
    <>
      <AuthInit setIsAuthorized={setIsAuthorized} />

      <AuthenticatedTemplate>
        {isAuthorized ? (
          <>
            <LogoutButton />
            {children}
          </>
        ) : (
          <div className="text-center mt-6">
            <p className="text-red-500">You are not authorized to view this content. Reach out to Akhil Anand or Ethan McDonald for access to Deepwiki. Mumford tenting is a requirement</p>
            <LogoutButton />
          </div>
        )}
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <div className="text-center">
          <p>Please sign in to continue.</p>
          <LoginButton />
        </div>
      </UnauthenticatedTemplate>
    </>
  );
};
