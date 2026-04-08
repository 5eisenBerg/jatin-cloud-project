# 🚀 Quick Start Guide - Traffic Fine System

## Option 1: Production Deployment to Azure (Recommended)

### One-Command Deployment
```powershell
cd c:\SEM 2 Mtech\CC\Traffic_Fines
.\scripts\deploy-azure.ps1
```

**That's it!** The script handles:
- ✅ Azure login
- ✅ Resource group creation
- ✅ Cloud infrastructure deployment (SQL, App Services, etc.)
- ✅ Database initialization
- ✅ Environment configuration

**Timeline**: ~10-15 minutes

---

## Option 2: Local Development (Fast Setup)

### Prerequisites Check
```bash
node --version   # Should be 18.x+
npm --version    # Should be 9.x+
```

### 1. Backend Setup (Terminal 1)
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Your backend starts at: `http://localhost:3001`

### 2. Frontend Setup (Terminal 2)  
```bash
cd frontend
npm install
copy .env.local.example .env.local
npm start
```

Your app opens at: `http://localhost:3000`

**Timeline**: 2-3 minutes

---

## ✅ Verify It's Working

1. **Frontend loads**: http://localhost:3000
2. **Dashboard visible**: ✅
3. **Can navigate pages**: ✅
4. **API responds**: Check browser console (no errors)

---

## Next Steps

### Local Development
- Edit code in `frontend/src/` or `backend/src/`
- Frontend auto-reloads on save
- Backend requires manual restart

### Production Deployment
- Run deployment script to publish to Azure
- App URLs provided after deployment completes
- Database automatically set up

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm install` fails | Delete `node_modules` and `package-lock.json`, try again |
| Port 3000/3001 already in use | Change PORT in backend `.env` |
| "Cannot find module" | Run `npm install` in that directory |
| Database errors | Skip - local dev doesn't need database if testing UI |

---

## Project Structure
```
frontend/                 # React app (port 3000)
  src/
    pages/               # Login, Dashboard, etc.
    components/          # Reusable UI components
    services/            # API calls
    
backend/                 # Express API (port 3001)
  src/
    routes/              # API endpoints
    config/              # Database config
    models/              # Database tables
    
infrastructure/          # Azure Bicep templates
  main.bicep
  parameters.json
  
scripts/                 # Deployment scripts
  deploy-azure.ps1
```

---

**Ready to start? Pick Option 1 or 2 above!** 🎉
