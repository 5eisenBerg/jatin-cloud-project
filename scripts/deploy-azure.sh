#!/bin/bash
# Azure Deployment Script for Traffic Fine Management System
# This script deploys all Azure resources using Bicep templates

set -e

# Configuration
RESOURCE_GROUP_NAME="trafficfine-rg"
LOCATION="eastus"
NAME_PREFIX="trafficfine"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Traffic Fine Management System Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in
echo -e "${YELLOW}Checking Azure login status...${NC}"
az account show > /dev/null 2>&1 || {
    echo -e "${YELLOW}Not logged in. Please login...${NC}"
    az login
}

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}Using subscription: $SUBSCRIPTION${NC}"

# Prompt for SQL password
echo -e "${YELLOW}Enter SQL Admin Password (min 8 chars, include upper, lower, number):${NC}"
read -s SQL_PASSWORD
echo ""

# Prompt for Azure AD B2C details (optional)
echo -e "${YELLOW}Enter Azure AD B2C Tenant Name (press Enter to skip):${NC}"
read B2C_TENANT
echo -e "${YELLOW}Enter Azure AD B2C Client ID (press Enter to skip):${NC}"
read B2C_CLIENT_ID

# Create resource group
echo -e "${YELLOW}Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

# Deploy Bicep template
echo -e "${YELLOW}Deploying infrastructure...${NC}"
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group $RESOURCE_GROUP_NAME \
    --template-file main.bicep \
    --parameters namePrefix=$NAME_PREFIX \
    --parameters location=$LOCATION \
    --parameters sqlAdminLogin=sqladmin \
    --parameters sqlAdminPassword="$SQL_PASSWORD" \
    --parameters b2cTenantName="$B2C_TENANT" \
    --parameters b2cClientId="$B2C_CLIENT_ID" \
    --query properties.outputs -o json)

# Extract outputs
BACKEND_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.backendUrl.value')
FRONTEND_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.frontendUrl.value')
SQL_SERVER=$(echo $DEPLOYMENT_OUTPUT | jq -r '.sqlServerFqdn.value')
STORAGE_ACCOUNT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.storageAccountName.value')

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backend URL: ${YELLOW}$BACKEND_URL${NC}"
echo -e "Frontend URL: ${YELLOW}$FRONTEND_URL${NC}"
echo -e "SQL Server: ${YELLOW}$SQL_SERVER${NC}"
echo -e "Storage Account: ${YELLOW}$STORAGE_ACCOUNT${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure Azure AD B2C (if not already done)"
echo "2. Update frontend .env with the backend URL"
echo "3. Deploy application code using GitHub Actions"
echo "4. Initialize the database schema"
