const { getConnection, sql } = require('../config/database');

// Initialize database tables
const initializeDatabase = async () => {
  const pool = await getConnection();
  
  // Create Users table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
    CREATE TABLE Users (
      id NVARCHAR(50) PRIMARY KEY,
      email NVARCHAR(255) NOT NULL UNIQUE,
      name NVARCHAR(255),
      role NVARCHAR(20) DEFAULT 'user',
      phone NVARCHAR(20),
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE()
    )
  `);

  // Create Vehicles table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Vehicles' AND xtype='U')
    CREATE TABLE Vehicles (
      id INT IDENTITY(1,1) PRIMARY KEY,
      vehicle_no NVARCHAR(20) NOT NULL,
      vehicle_type NVARCHAR(20) NOT NULL,
      user_id NVARCHAR(50),
      owner_name NVARCHAR(255),
      registered_at DATETIME2 DEFAULT GETDATE(),
      CONSTRAINT FK_Vehicle_User FOREIGN KEY (user_id) REFERENCES Users(id),
      CONSTRAINT UQ_Vehicle_No UNIQUE (vehicle_no)
    )
  `);

  // Create Fines table
  await pool.request().query(`
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
      paid_at DATETIME2,
      CONSTRAINT FK_Fine_Vehicle FOREIGN KEY (vehicle_no) REFERENCES Vehicles(vehicle_no)
    )
  `);

  // Create Payments table
  await pool.request().query(`
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
      created_at DATETIME2 DEFAULT GETDATE(),
      CONSTRAINT FK_Payment_Fine FOREIGN KEY (fine_id) REFERENCES Fines(fine_id)
    )
  `);

  // Create indexes for better query performance
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fines_VehicleNo')
    CREATE INDEX IX_Fines_VehicleNo ON Fines(vehicle_no)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fines_Status')
    CREATE INDEX IX_Fines_Status ON Fines(status)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Vehicles_UserId')
    CREATE INDEX IX_Vehicles_UserId ON Vehicles(user_id)
  `);

  console.log('Database tables initialized successfully');
};

module.exports = { initializeDatabase };
