const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');

class User {
  static async findById(id) {
    return await get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async findByEmail(email) {
    return await get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async create(userData) {
    const id = userData.id || `user-${uuidv4().substring(0, 12)}`;
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    
    await run(
      `INSERT INTO users (id, email, password, name, phone, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userData.email, hashedPassword, userData.name, userData.phone || '', userData.role || 'user']
    );
    
    return await this.findById(id);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  static async update(id, userData) {
    let sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (userData.name) {
      sql += ', name = ?';
      params.push(userData.name);
    }
    if (userData.phone) {
      sql += ', phone = ?';
      params.push(userData.phone);
    }
    if (userData.password) {
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      sql += ', password = ?';
      params.push(hashedPassword);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await run(sql, params);
    return await this.findById(id);
  }

  static async findAll(role = null) {
    let sql = 'SELECT id, email, name, role, phone, created_at FROM users';
    if (role) {
      sql += ` WHERE role = ?`;
      return await all(sql, [role]);
    }
    return await all(sql + ' ORDER BY created_at DESC');
  }

  static async delete(id) {
    await run('DELETE FROM users WHERE id = ?', [id]);
  }
}

module.exports = User;
