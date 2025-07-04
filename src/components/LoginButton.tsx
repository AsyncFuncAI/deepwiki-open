'use client';

import { useMsal } from "@azure/msal-react";

export const LoginButton = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(); // or loginPopup()
  };

  return (
    <button onClick={handleLogin} className="btn">
      Sign In
    </button>
  );
};
