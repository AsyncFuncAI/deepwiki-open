"use client";

import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/app/authConfig";
import { PublicClientApplication } from "@azure/msal-browser";

const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize()

export const MsalWrapper = ({ children }: { children: React.ReactNode }) => {

    return (
        <MsalProvider instance={msalInstance}>
            {children}
        </MsalProvider>
    );
};
