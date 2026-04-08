const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Azure Blob Storage configuration
const getBlobServiceClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }
  
  // Use Managed Identity in production
  const accountName = process.env.AZURE_STORAGE_ACCOUNT;
  const credential = new DefaultAzureCredential();
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
};

// Azure Key Vault configuration
const getSecretClient = () => {
  const vaultUrl = process.env.AZURE_KEYVAULT_URI;
  if (!vaultUrl) {
    return null;
  }
  const credential = new DefaultAzureCredential();
  return new SecretClient(vaultUrl, credential);
};

// Get secret from Key Vault
const getSecret = async (secretName) => {
  const client = getSecretClient();
  if (!client) {
    console.warn('Key Vault not configured, using environment variables');
    return null;
  }
  
  try {
    const secret = await client.getSecret(secretName);
    return secret.value;
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error.message);
    return null;
  }
};

// Azure AD B2C configuration
const getB2CConfig = () => ({
  identityMetadata: `https://${process.env.AZURE_AD_B2C_TENANT_NAME}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/${process.env.AZURE_AD_B2C_POLICY_NAME}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_AD_B2C_CLIENT_ID,
  audience: process.env.AZURE_AD_B2C_AUDIENCE,
  policyName: process.env.AZURE_AD_B2C_POLICY_NAME,
  isB2C: true,
  validateIssuer: true,
  loggingLevel: 'warn',
  passReqToCallback: false
});

// Computer Vision configuration
const getComputerVisionConfig = () => ({
  endpoint: process.env.AZURE_CV_ENDPOINT,
  key: process.env.AZURE_CV_KEY
});

module.exports = {
  getBlobServiceClient,
  getSecretClient,
  getSecret,
  getB2CConfig,
  getComputerVisionConfig
};
