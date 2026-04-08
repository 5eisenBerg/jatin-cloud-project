-- Traffic Fine Management System - Database Initialization Script
-- Run this script to create all necessary tables in Azure SQL Database

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
    CONSTRAINT FK_Vehicle_User FOREIGN KEY (user_id) REFERENCES Users(id),
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
    paid_at DATETIME2,
    CONSTRAINT FK_Fine_Vehicle FOREIGN KEY (vehicle_no) REFERENCES Vehicles(vehicle_no)
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
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Payment_Fine FOREIGN KEY (fine_id) REFERENCES Fines(fine_id)
);

-- Create Indexes for better performance
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_PaidBy')
CREATE INDEX IX_Payments_PaidBy ON Payments(paid_by);

-- Insert sample data for testing (optional)
-- Uncomment to add test data

/*
-- Insert test admin user
INSERT INTO Users (id, email, name, role) VALUES 
('admin-001', 'admin@trafficfine.com', 'Admin User', 'admin');

-- Insert test regular user
INSERT INTO Users (id, email, name, role) VALUES 
('user-001', 'user@example.com', 'Test User', 'user');

-- Insert sample vehicles
INSERT INTO Vehicles (vehicle_no, vehicle_type, owner_name) VALUES 
('MH 12 AB 1234', 'Car', 'John Doe'),
('MH 14 CD 5678', 'Bike', 'Jane Smith'),
('MH 01 EF 9012', 'Truck', 'Bob Wilson');

-- Insert sample fines
INSERT INTO Fines (fine_id, vehicle_no, vehicle_type, violations, amount, status, location, officer_name) VALUES 
('FN-001', 'MH 12 AB 1234', 'Car', '["SIGNAL_JUMP","NO_SEATBELT"]', 2000, 'pending', 'Mumbai Central', 'Officer Kumar'),
('FN-002', 'MH 14 CD 5678', 'Bike', '["NO_HELMET"]', 1000, 'pending', 'Andheri', 'Officer Singh'),
('FN-003', 'MH 01 EF 9012', 'Truck', '["OVER_SPEEDING"]', 2000, 'paid', 'Thane', 'Officer Patel');

-- Insert sample payment
INSERT INTO Payments (payment_id, fine_id, amount, payment_method, transaction_id, paid_by) VALUES 
('PAY-001', 'FN-003', 2000, 'card', 'TXN-123456', 'user-001');
*/

PRINT 'Database initialization completed successfully!';
