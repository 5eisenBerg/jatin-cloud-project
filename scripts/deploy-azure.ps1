# Azure Deployment Script for Traffic Fine Management System (PowerShell)
# This script deploys all Azure resources using Bicep templates

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "trafficfine-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$NamePrefix = "trafficfine"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Traffic Fine Management System Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if Azure CLI is installed
try {
    az --version | Out-Null
} catch {
    Write-Host "Error: Azure CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if logged in
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    az account show | Out-Null
} catch {
    Write-Host "Not logged in. Please login..." -ForegroundColor Yellow
    az login
}

# Get current subscription
$Subscription = az account show --query name -o tsv
Write-Host "Using subscription: $Subscription" -ForegroundColor Green

# Prompt for SQL password
$SqlPassword = Read-Host "Enter SQL Admin Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlPassword)
$SqlPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Prompt for Azure AD B2C details (optional)
$B2CTenant = Read-Host "Enter Azure AD B2C Tenant Name (press Enter to skip)"
$B2CClientId = Read-Host "Enter Azure AD B2C Client ID (press Enter to skip)"

# Create resource group
Write-Host "Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Change to infrastructure directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfraDir = Join-Path (Split-Path -Parent $ScriptDir) "infrastructure"
Push-Location $InfraDir

try {
    # Deploy Bicep template
    Write-Host "Deploying infrastructure..." -ForegroundColor Yellow
    $DeploymentOutput = az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file main.bicep `
        --parameters namePrefix=$NamePrefix `
        --parameters location=$Location `
        --parameters sqlAdminLogin=sqladmin `
        --parameters sqlAdminPassword="$SqlPasswordPlain" `
        --parameters b2cTenantName="$B2CTenant" `
        --parameters b2cClientId="$B2CClientId" `
        --query properties.outputs -o json | ConvertFrom-Json

    # Extract outputs
    $BackendUrl = $DeploymentOutput.backendUrl.value
    $FrontendUrl = $DeploymentOutput.frontendUrl.value
    $SqlServer = $DeploymentOutput.sqlServerFqdn.value
    $StorageAccount = $DeploymentOutput.storageAccountName.value
    $AppInsightsKey = $DeploymentOutput.appInsightsInstrumentationKey.value

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
    Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Yellow
    Write-Host "SQL Server: $SqlServer" -ForegroundColor Yellow
    Write-Host "Storage Account: $StorageAccount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Configure Azure AD B2C (if not already done)"
    Write-Host "2. Update frontend .env with the backend URL"
    Write-Host "3. Deploy application code using GitHub Actions"
    Write-Host "4. Initialize the database schema"

    # Save outputs to file for CI/CD
    $OutputsFile = Join-Path (Split-Path -Parent $ScriptDir) ".azure-outputs.json"
    @{
        backendUrl = $BackendUrl
        frontendUrl = $FrontendUrl
        sqlServer = $SqlServer
        storageAccount = $StorageAccount
        appInsightsKey = $AppInsightsKey
    } | ConvertTo-Json | Out-File $OutputsFile

    Write-Host "Outputs saved to: $OutputsFile" -ForegroundColor Green

} finally {
    Pop-Location
}
