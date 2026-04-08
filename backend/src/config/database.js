const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use SQLite for local development
const dbPath = path.join(__dirname, '../../traffic_fines.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database open error:', err);
  } else {
    console.log('✅ Connected to SQLite Database:', dbPath);
    initializeDatabase();
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vehicles table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_no TEXT NOT NULL UNIQUE,
        vehicle_type TEXT NOT NULL,
        owner_name TEXT,
        user_id TEXT,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Fines table
    db.run(`
      CREATE TABLE IF NOT EXISTS fines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fine_id TEXT NOT NULL UNIQUE,
        vehicle_no TEXT NOT NULL,
        vehicle_type TEXT,
        violations TEXT,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        image_path TEXT,
        location TEXT,
        officer_id TEXT,
        officer_name TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME,
        FOREIGN KEY(vehicle_no) REFERENCES vehicles(vehicle_no),
        FOREIGN KEY(officer_id) REFERENCES users(id)
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT NOT NULL UNIQUE,
        fine_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT,
        transaction_id TEXT,
        status TEXT DEFAULT 'completed',
        paid_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(fine_id) REFERENCES fines(fine_id),
        FOREIGN KEY(paid_by) REFERENCES users(id)
      )
    `);

    console.log('✅ Database tables initialized');

    // Check if sample data exists
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (!err && row.count === 0) {
        insertSampleData();
      }
    });
  });
}

function insertSampleData() {
  // Sample admin user (password: admin123)
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(
    `INSERT INTO users (id, email, password, name, role, phone) 
     VALUES ('admin-001', 'admin@trafficfine.com', ?, 'Admin Officer', 'admin', '9876543210')`,
    [hashedPassword],
    (err) => {
      if (!err) console.log('✅ Sample admin created (admin@trafficfine.com / admin123)');
    }
  );

  // Sample regular user (password: user123)
  const userPassword = bcrypt.hashSync('user123', 10);
  db.run(
    `INSERT INTO users (id, email, password, name, role, phone) 
     VALUES ('user-001', 'user@example.com', ?, 'John Citizen', 'user', '9123456789')`,
    [userPassword],
    (err) => {
      if (!err) console.log('✅ Sample user created (user@example.com / user123)');
    }
  );

  // Sample vehicles
  db.run(`INSERT INTO vehicles (vehicle_no, vehicle_type, owner_name, user_id) 
          VALUES ('MH01AB1234', 'Car', 'John Citizen', 'user-001')`);
  db.run(`INSERT INTO vehicles (vehicle_no, vehicle_type, owner_name) 
          VALUES ('MH02CD5678', 'Bike', 'Unknown Owner')`);
  db.run(`INSERT INTO vehicles (vehicle_no, vehicle_type, owner_name) 
          VALUES ('MH03EF9012', 'Truck', 'Unknown Owner')`);
}

async function getConnection() {
  return db;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  getConnection,
  db,
  run,
  get,
  all
};
