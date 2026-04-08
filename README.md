# Smart Traffic Fine Management System (ANPR-based)

A production-ready, full-stack web application for managing traffic fines using Automatic Number Plate Recognition (ANPR) technology. Built with React, Node.js/Express, and Azure Cloud Services.

![Architecture](https://img.shields.io/badge/Architecture-Serverless-blue)
![Azure](https://img.shields.io/badge/Cloud-Azure-0089D6)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![React](https://img.shields.io/badge/React-18.x-61DAFB)

## 🌟 Features

### Admin (Police) Module
- 🔐 Secure login with Azure AD B2C
- 📸 Add fines via image upload (OCR-based number plate extraction)
- ✏️ Manual vehicle number entry with edit capability
- 🚗 Vehicle type detection (Car, Bike, Truck, Bus)
- ⚠️ 15 predefined violation categories with amounts
- 💰 Auto-calculation of fine amounts
- 📊 Dashboard with analytics and charts
- 🔍 Vehicle search and history
- 🚨 Repeat offender detection

### User (Citizen) Module
- 🔐 Secure registration/login with Azure AD B2C
- 🔍 Check fines by vehicle number or image upload
- 💳 Online fine payment (simulated)
- 📋 View pending and paid fines
- 📜 Payment history with receipts
- 🚗 Support for multiple vehicles

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React App      │────▶│  Express API     │────▶│  Azure SQL DB    │
│   (Frontend)     │     │  (Backend)       │     │  (Basic Tier)    │
│   Material UI    │     │  Node.js 18      │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │
        │                        ▼
        │                ┌──────────────────┐
        │                │  Azure Blob      │
        │                │  Storage         │
        │                └────────┬─────────┘
        │                         │ (Blob Trigger)
        │                         ▼
        │                ┌──────────────────┐
        └───────────────▶│  Azure Function  │
                         │  (OCR Processor) │
                         │  Computer Vision │
                         └──────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Material UI 5, React Router 6, Recharts |
| Backend | Node.js 18, Express.js, mssql |
| Database | Azure SQL Database (Basic Tier) |
| Storage | Azure Blob Storage |
| Auth | Azure AD B2C |
| OCR | Azure Computer Vision (Free Tier) |
| Functions | Azure Functions (Consumption Plan) |
| Monitoring | Application Insights |
| CI/CD | GitHub Actions |
| IaC | Bicep Templates |

## 📁 Project Structure

```
Traffic_Fines/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/               # React application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── hooks/          # Custom hooks
│   │   └── App.js
│   └── package.json
│
├── azure-functions/        # Serverless functions
│   ├── ocr-processor/      # OCR processing function
│   └── host.json
│
├── infrastructure/         # Azure Bicep templates
│   ├── main.bicep
│   └── parameters.json
│
├── .github/workflows/      # CI/CD pipelines
│   ├── azure-deploy.yml
│   └── ci.yml
│
├── scripts/                # Deployment scripts
│   ├── deploy-azure.sh
│   └── deploy-azure.ps1
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- Azure subscription (Student subscription works!)
- Azure CLI installed
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/traffic-fine-system.git
   cd traffic-fine-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your Azure credentials
   npm install
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your settings
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Development Mode (Without Azure)

For local testing without Azure services:

1. Set `REACT_APP_ENVIRONMENT=development` in frontend `.env`
2. Set `SKIP_AUTH=true` and `NODE_ENV=development` in backend `.env`
3. The app will use mock authentication and simulated services

## ☁️ Azure Deployment

### One-Command Deployment

**Windows (PowerShell):**
```powershell
.\scripts\deploy-azure.ps1
```

**Linux/Mac:**
```bash
chmod +x ./scripts/deploy-azure.sh
./scripts/deploy-azure.sh
```

### Manual Deployment Steps

1. **Login to Azure**
   ```bash
   az login
   az account set --subscription "Your Subscription Name"
   ```

2. **Create Resource Group**
   ```bash
   az group create --name trafficfine-rg --location eastus
   ```

3. **Deploy Infrastructure**
   ```bash
   cd infrastructure
   az deployment group create \
     --resource-group trafficfine-rg \
     --template-file main.bicep \
     --parameters parameters.json \
     --parameters sqlAdminPassword="YourSecurePassword123!"
   ```

4. **Configure GitHub Secrets**
   
   Add these secrets to your GitHub repository:
   - `AZURE_CREDENTIALS` - Azure service principal JSON
   - `AZURE_AD_B2C_CLIENT_ID` - B2C application client ID
   - `AZURE_AD_B2C_TENANT_NAME` - B2C tenant name
   - `BACKEND_URL` - Deployed backend URL

5. **Push to trigger deployment**
   ```bash
   git push origin main
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=production
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=trafficfines
SQL_USER=sqladmin
SQL_PASSWORD=your-password
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_CV_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
AZURE_CV_KEY=your-key
AZURE_AD_B2C_TENANT_NAME=your-tenant
AZURE_AD_B2C_CLIENT_ID=your-client-id
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_AZURE_AD_B2C_CLIENT_ID=your-client-id
REACT_APP_AZURE_AD_B2C_TENANT_NAME=your-tenant-name
REACT_APP_ENVIRONMENT=development
```

## 💰 Cost Optimization

This project is designed for **Azure Student subscription** with minimal costs:

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| App Service | F1 (Free) | $0 |
| SQL Database | Basic | ~$5 |
| Blob Storage | Standard LRS | ~$1 |
| Computer Vision | F0 (Free) | $0 |
| Functions | Consumption | ~$0 |
| **Total** | | **~$6/month** |

## 📊 Database Schema

```sql
-- Users Table
CREATE TABLE Users (
  id NVARCHAR(50) PRIMARY KEY,
  email NVARCHAR(255) NOT NULL UNIQUE,
  name NVARCHAR(255),
  role NVARCHAR(20) DEFAULT 'user',
  phone NVARCHAR(20),
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Vehicles Table
CREATE TABLE Vehicles (
  id INT IDENTITY(1,1) PRIMARY KEY,
  vehicle_no NVARCHAR(20) NOT NULL UNIQUE,
  vehicle_type NVARCHAR(20) NOT NULL,
  user_id NVARCHAR(50),
  owner_name NVARCHAR(255)
);

-- Fines Table
CREATE TABLE Fines (
  id INT IDENTITY(1,1) PRIMARY KEY,
  fine_id NVARCHAR(50) NOT NULL UNIQUE,
  vehicle_no NVARCHAR(20) NOT NULL,
  violations NVARCHAR(MAX) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status NVARCHAR(20) DEFAULT 'pending',
  image_url NVARCHAR(500),
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Payments Table
CREATE TABLE Payments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  payment_id NVARCHAR(50) NOT NULL UNIQUE,
  fine_id NVARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method NVARCHAR(50),
  transaction_id NVARCHAR(100),
  status NVARCHAR(20) DEFAULT 'completed'
);
```

## 🔒 Security

- Azure AD B2C for authentication
- HTTPS enforced on all endpoints
- SQL injection prevention via parameterized queries
- CORS configured for specific origins
- Secrets stored in Azure Key Vault
- Input validation on all API endpoints

## 📝 API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Fines
- `GET /api/fines` - List all fines (with filters)
- `GET /api/fines/:fineId` - Get fine details
- `GET /api/fines/vehicle/:vehicleNo` - Get fines by vehicle
- `POST /api/fines` - Create new fine (Admin)
- `PATCH /api/fines/:fineId/status` - Update fine status

### Vehicles
- `GET /api/vehicles/my` - Get user's vehicles
- `GET /api/vehicles/:vehicleNo` - Get vehicle details
- `GET /api/vehicles/:vehicleNo/history` - Get vehicle history
- `POST /api/vehicles` - Register vehicle

### Payments
- `POST /api/payments/:fineId/pay` - Pay a fine
- `POST /api/payments/bulk-pay` - Pay multiple fines
- `GET /api/payments/history` - Get payment history

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/offenders` - Get repeat offenders

### Upload
- `POST /api/upload/image` - Upload image
- `POST /api/upload/ocr` - Upload and process with OCR

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Azure Documentation
- Material UI Team
- React Community

---

**Built with ❤️ for Cloud Computing coursework**
# jatin-cloud-project
