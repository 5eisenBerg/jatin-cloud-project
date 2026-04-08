// Azure Bicep Template for Traffic Fine Management System
// Uses only free/low-cost tiers suitable for Azure Student subscription

targetScope = 'resourceGroup'

@description('The name prefix for all resources')
param namePrefix string = 'trafficfine'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The administrator login for SQL Server')
@secure()
param sqlAdminLogin string

@description('The administrator password for SQL Server')
@secure()
param sqlAdminPassword string

@description('The Azure AD B2C tenant name')
param b2cTenantName string = ''

@description('The Azure AD B2C client ID')
param b2cClientId string = ''

// Variables
var uniqueSuffix = substring(uniqueString(resourceGroup().id), 0, 8)
var appServicePlanName = '${namePrefix}-plan-${uniqueSuffix}'
var backendAppName = '${namePrefix}-api-${uniqueSuffix}'
var frontendAppName = '${namePrefix}-web-${uniqueSuffix}'
var functionAppName = '${namePrefix}-func-${uniqueSuffix}'
var storageAccountName = toLower('${namePrefix}st${uniqueSuffix}')
var sqlServerName = '${namePrefix}-sql-${uniqueSuffix}'
var sqlDatabaseName = 'trafficfines'
var cognitiveAccountName = '${namePrefix}-cv-${uniqueSuffix}'
var keyVaultName = '${namePrefix}-kv-${uniqueSuffix}'
var appInsightsName = '${namePrefix}-ai-${uniqueSuffix}'
var logAnalyticsName = '${namePrefix}-log-${uniqueSuffix}'
var functionPlanName = '${namePrefix}-funcplan-${uniqueSuffix}'

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
  }
}

// Storage Account (for Blob Storage and Function App)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'  // Lowest cost option
  }
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false  // No public access per subscription policy
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Blob Container for vehicle images
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource vehicleImagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'vehicle-images'
  properties: {
    publicAccess: 'None'  // Private - use SAS tokens for access
  }
}

resource ocrResultsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'ocr-results'
  properties: {
    publicAccess: 'None'
  }
}

// App Service Plan (Free Tier F1)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'F1'  // Free tier
    tier: 'Free'
    size: 'F1'
    family: 'F'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true  // Linux
  }
}

// Backend App Service
resource backendApp 'Microsoft.Web/sites@2022-09-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'SQL_SERVER'
          value: '${sqlServerName}.database.windows.net'
        }
        {
          name: 'SQL_DATABASE'
          value: sqlDatabaseName
        }
        {
          name: 'SQL_USER'
          value: sqlAdminLogin
        }
        {
          name: 'SQL_PASSWORD'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=sql-password)'
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'AZURE_STORAGE_CONTAINER'
          value: 'vehicle-images'
        }
        {
          name: 'AZURE_CV_ENDPOINT'
          value: cognitiveAccount.properties.endpoint
        }
        {
          name: 'AZURE_CV_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=cv-key)'
        }
        {
          name: 'FRONTEND_URL'
          value: 'https://${frontendAppName}.azurewebsites.net'
        }
        {
          name: 'AZURE_AD_B2C_TENANT_NAME'
          value: b2cTenantName
        }
        {
          name: 'AZURE_AD_B2C_CLIENT_ID'
          value: b2cClientId
        }
        {
          name: 'AZURE_AD_B2C_POLICY_NAME'
          value: 'B2C_1_signupsignin'
        }
      ]
      cors: {
        allowedOrigins: [
          'https://${frontendAppName}.azurewebsites.net'
          'http://localhost:3000'
        ]
        supportCredentials: true
      }
    }
    httpsOnly: true
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Frontend App Service
resource frontendApp 'Microsoft.Web/sites@2022-09-01' = {
  name: frontendAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'REACT_APP_API_URL'
          value: 'https://${backendAppName}.azurewebsites.net/api'
        }
        {
          name: 'REACT_APP_AZURE_AD_B2C_CLIENT_ID'
          value: b2cClientId
        }
        {
          name: 'REACT_APP_AZURE_AD_B2C_TENANT_NAME'
          value: b2cTenantName
        }
        {
          name: 'REACT_APP_AZURE_AD_B2C_POLICY_NAME'
          value: 'B2C_1_signupsignin'
        }
        {
          name: 'REACT_APP_ENVIRONMENT'
          value: 'production'
        }
      ]
    }
    httpsOnly: true
  }
}

// Azure SQL Server
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// SQL Database (Basic Tier - lowest cost)
resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'Basic'  // Basic tier - cheapest option
    tier: 'Basic'
    capacity: 5
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648  // 2GB
  }
}

// SQL Firewall Rule - Allow Azure Services
resource sqlFirewallAzure 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Computer Vision (Free Tier)
resource cognitiveAccount 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: cognitiveAccountName
  location: location
  kind: 'ComputerVision'
  sku: {
    name: 'F0'  // Free tier
  }
  properties: {
    customSubDomainName: cognitiveAccountName
    publicNetworkAccess: 'Enabled'
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: backendApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// Key Vault Secrets
resource sqlPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'sql-password'
  properties: {
    value: sqlAdminPassword
  }
}

resource cvKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'cv-key'
  properties: {
    value: cognitiveAccount.listKeys().key1
  }
}

resource storageKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-key'
  properties: {
    value: storageAccount.listKeys().keys[0].value
  }
}

// Function App Consumption Plan (Separate from App Service Plan)
resource functionPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: functionPlanName
  location: location
  sku: {
    name: 'Y1'  // Consumption plan - pay per execution
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: true  // Linux
  }
}

// Function App (Consumption Plan)
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: functionPlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18'
      appSettings: [
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: functionAppName
        }
        {
          name: 'AZURE_CV_ENDPOINT'
          value: cognitiveAccount.properties.endpoint
        }
        {
          name: 'AZURE_CV_KEY'
          value: cognitiveAccount.listKeys().key1
        }
        {
          name: 'SQL_SERVER'
          value: '${sqlServerName}.database.windows.net'
        }
        {
          name: 'SQL_DATABASE'
          value: sqlDatabaseName
        }
        {
          name: 'SQL_USER'
          value: sqlAdminLogin
        }
        {
          name: 'SQL_PASSWORD'
          value: sqlAdminPassword
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
      ]
    }
    httpsOnly: true
  }
}

// Outputs
output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
output frontendUrl string = 'https://${frontendApp.properties.defaultHostName}'
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output storageAccountName string = storageAccount.name
output keyVaultUri string = keyVault.properties.vaultUri
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
