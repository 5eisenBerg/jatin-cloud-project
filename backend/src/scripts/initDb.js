/**
 * Database Initialization Script
 * Run this to create tables in Azure SQL Database
 * Usage: node src/scripts/initDb.js
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: process.env.NODE_ENV !== 'production'
    }
};

const createTablesSQL = `
-- Create Users Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    name NVARCHAR(255),
    role NVARCHAR(20) DEFAULT 'user',
    phone NVARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create Vehicles Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Vehicles' AND xtype='U')
CREATE TABLE Vehicles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    vehicle_no NVARCHAR(20) NOT NULL,
    vehicle_type NVARCHAR(20) NOT NULL,
    user_id NVARCHAR(50),
    owner_name NVARCHAR(255),
    registered_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT UQ_Vehicle_No UNIQUE (vehicle_no)
);

-- Create Fines Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Fines' AND xtype='U')
CREATE TABLE Fines (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fine_id NVARCHAR(50) NOT NULL UNIQUE,
    vehicle_no NVARCHAR(20) NOT NULL,
    vehicle_type NVARCHAR(20),
    violations NVARCHAR(MAX) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    image_url NVARCHAR(500),
    location NVARCHAR(255),
    officer_id NVARCHAR(50),
    officer_name NVARCHAR(255),
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    paid_at DATETIME2
);

-- Create Payments Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payments' AND xtype='U')
CREATE TABLE Payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    payment_id NVARCHAR(50) NOT NULL UNIQUE,
    fine_id NVARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method NVARCHAR(50),
    transaction_id NVARCHAR(100),
    status NVARCHAR(20) DEFAULT 'completed',
    paid_by NVARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Create Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fines_VehicleNo')
CREATE INDEX IX_Fines_VehicleNo ON Fines(vehicle_no);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fines_Status')
CREATE INDEX IX_Fines_Status ON Fines(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fines_CreatedAt')
CREATE INDEX IX_Fines_CreatedAt ON Fines(created_at);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Vehicles_UserId')
CREATE INDEX IX_Vehicles_UserId ON Vehicles(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_FineId')
CREATE INDEX IX_Payments_FineId ON Payments(fine_id);
`;

async function initializeDatabase() {
    let pool;
    try {
        console.log('🔌 Connecting to database...');
        console.log(`   Server: ${config.server}`);
        console.log(`   Database: ${config.database}`);
        
        pool = await sql.connect(config);
        console.log('✅ Connected to database');

        console.log('📊 Creating tables...');
        await pool.request().query(createTablesSQL);
        console.log('✅ Tables created successfully!');
        
        // Verify tables were created
        const result = await pool.request().query(\`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        \`);
        
        console.log('\\n📋 Tables in database:');
        result.recordset.forEach(row => {
            console.log(\`   ✓ \${row.TABLE_NAME}\`);
        });

        console.log('\\n🎉 Database initialization completed successfully!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        if (error.code === 'ELOGIN') {
            console.log('\\n💡 Tip: Check your SQL credentials in .env file');
        }
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('\\n🔌 Database connection closed');
        }
    }
}

// Run if executed directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
