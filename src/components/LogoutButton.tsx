"use client";

import { useMsal } from "@azure/msal-react";

export const LogoutButton = () => {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutRedirect(); // or logoutPopup()
  };

  return <button onClick={handleLogout}>Sign Out</button>;
};
