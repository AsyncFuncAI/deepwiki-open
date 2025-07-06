"use client";

import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

export const AuthInit = ({
  setIsAuthorized,
}: {
  setIsAuthorized: (value: boolean) => void;
}) => {
  const { instance } = useMsal();

  useEffect(() => {
    const init = async () => {
      try {
        const response = await instance.handleRedirectPromise();

        if (response) {
          console.log("Login completed:");

          const body = {
            oid: response.account?.idTokenClaims?.oid,
            name: response.account?.username,
          };

          const apiResponse = await fetch(`/api/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          const result = await apiResponse.json();

          if (result.authorized) {
            console.log("User authorized by backend");
            setIsAuthorized(true);
          } else {
            console.log("User not authorized by backend");
            setIsAuthorized(false);
          }
        }
      } catch (error) {
        console.error("Login redirect error:", error);
        setIsAuthorized(false);
      }
    };

    init();
  }, [instance, setIsAuthorized]);

  return null;
};
