# Traffic Fine Management System - Setup Guide

## Quick Start (Production - Azure Deployment)

### Prerequisites
- Azure Subscription (Student subscription works with free tiers)
- Azure CLI installed
- PowerShell 7+
- Node.js 18+

### Deployment Steps

1. **Clone and Navigate**
```bash
cd Traffic_Fines
```

2. **Run Azure Deployment**
```powershell
.\scripts\deploy-azure.ps1
```

The script will:
- ✅ Create Azure Resource Group
- ✅ Deploy all cloud resources (App Services, SQL Database, Storage, etc.)
- ✅ Set up Azure AD B2C (optional)
- ✅ Initialize the database

---

## Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- SQL Server (or SQL Server Express, LocalDB)
- Python 3.7+ (for Azure Functions testing - optional)

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env with your local SQL Server credentials
# Default: localhost, sa, [your-password]
```

### Step 2: Database Initialization

```bash
# Initialize database tables
npm run db:init

# Or manually connect to SQL Server and run:
# sql-cmd or SQL Server Management Studio
# Execute: scripts/init-database.sql
```

### Step 3: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

Backend will run at: **http://localhost:3001**

---

### Step 4: Frontend Setup

```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Create .env.local file
copy .env.local.example .env.local

# Keep default settings for local development
```

### Step 5: Start Frontend

```bash
npm start
```

Frontend will open at: **http://localhost:3000**

---

## Testing the Application

### Default Test Accounts (Local Development)

You can login with any credentials initially. In development mode, authentication checks are simplified.

**Admin Dashboard**: http://localhost:3000/admin
**User Dashboard**: http://localhost:3000/user

### Quick Test Workflow

1. **Add a Fine (Admin)**
   - Go to "Add Fine"
   - Upload vehicle image or enter plate number
   - Select violation and amount
   - Submit

2. **Check Fines (User)**
   - Go to "Check Fines"
   - Enter vehicle number or upload photo
   - View pending fines
   - Process payment (simulated)

---

## Environment Variables Explained

### Backend (.env)
| Variable | Purpose | Default |
|----------|---------|---------|
| `SQL_SERVER` | Database host | localhost |
| `SQL_DATABASE` | Database name | trafficfines |
| `SQL_USER` | Database user | sa |
| `SQL_PASSWORD` | Database password | (required) |
| `FRONTEND_URL` | CORS origin | http://localhost:3000 |

### Frontend (.env.local)
| Variable | Purpose | Default |
|----------|---------|---------|
| `REACT_APP_API_URL` | Backend API URL | http://localhost:3001/api |
| `REACT_APP_ENVIRONMENT` | Environment | development |

---

## Azure Deployment Details

### Resources Deployed
- **App Service Plan** (Free Tier F1)
- **Backend App Service** (Node.js 18)
- **Frontend App Service** (React, served from Node.js)
- **Azure SQL Database** (Basic Tier 5 DTU)
- **Blob Storage** (Standard LRS)
- **Computer Vision** (Free Tier F0 - in eastus region)
- **Key Vault** (for secrets management)
- **Application Insights** (monitoring)
- **Azure Functions** (Consumption Plan - OCR processing)

### Deployment Region Fixed
**Region**: `eastus` (Free tier Computer Vision availability)

If you need Southeast Asia, upgrade Computer Vision to S1 tier in the Bicep template.

---

## Troubleshooting

### "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

### Database connection fails
- Check SQL Server is running
- Verify credentials in .env
- Ensure database exists (run db:init)
- Check SQL Server firewall rules

### Azure Deployment fails
- Verify you're logged in: `az login`
- Check quota/limits in your subscription
- Review subscription may not support certain regions
- **Fixed**: Using `eastus` for F0 Computer Vision

### CORS errors in frontend
- Backend CORS must include frontend URL
- For Azure: Update App Settings
- For local: `.env` should have `FRONTEND_URL=http://localhost:3000`

---

## Architecture Overview

```
Local Development:
├── Frontend (React)         → http://localhost:3000
├── Backend (Express)        → http://localhost:3001
└── Database (SQL Server)    → localhost:1433

Azure Production:
├── Frontend App Service
├── Backend App Service
├── Azure SQL Database
├── Blob Storage
├── Computer Vision API
├── Key Vault
└── Application Insights
```

---

## Database Schema

### Main Tables
- **Users** - User accounts and profiles
- **Vehicles** - Vehicle information
- **Fines** - Traffic fine records
- **Payments** - Payment transactions
- **ViolationCategories** - Fine types and amounts

---

## Next Steps

1. ✅ Deploy to Azure (recommended for production)
2. ✅ Set up Azure AD B2C for authentication
3. ✅ Configure Computer Vision for OCR processing
4. ✅ Set up CI/CD with GitHub Actions
5. ✅ Add custom violation categories specific to your city

---

## Support

For issues:
1. Check application logs: `Application Insights` (Azure) or console (local)
2. Verify environment variables
3. Check database connectivity
4. Review network/firewall settings
