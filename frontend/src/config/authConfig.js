import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_AD_B2C_CLIENT_ID || 'your-client-id',
    authority: `https://${process.env.REACT_APP_AZURE_AD_B2C_TENANT_NAME || 'your-tenant'}.b2clogin.com/${process.env.REACT_APP_AZURE_AD_B2C_TENANT_NAME || 'your-tenant'}.onmicrosoft.com/${process.env.REACT_APP_AZURE_AD_B2C_POLICY_NAME || 'B2C_1_signupsignin'}`,
    knownAuthorities: [`${process.env.REACT_APP_AZURE_AD_B2C_TENANT_NAME || 'your-tenant'}.b2clogin.com`],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

// Login request configuration
export const loginRequest = {
  scopes: ['openid', 'profile', 'offline_access'],
};

// API request configuration
export const apiRequest = {
  scopes: [`https://${process.env.REACT_APP_AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/api/access`],
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance.initialize().then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
});

export default msalConfig;
