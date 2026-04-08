const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');
const { VIOLATION_TYPES } = require('../config/constants');

class Fine {
  static async findById(fineId) {
    return await get('SELECT * FROM fines WHERE fine_id = ?', [fineId]);
  }

  static async findByVehicleNo(vehicleNo, status = null) {
    let sql = 'SELECT * FROM fines WHERE vehicle_no = ?';
    const params = [vehicleNo.toUpperCase()];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    return await all(sql, params);
  }

  static async create(fineData) {
    const fineId = `FN-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Calculate total amount from violations
    const violations = typeof fineData.violations === 'string' 
      ? JSON.parse(fineData.violations) 
      : fineData.violations;

    const amount = violations.reduce((sum, v) => {
      const violationType = VIOLATION_TYPES[v];
      return sum + (violationType ? violationType.amount : 0);
    }, 0);

    await run(
      `INSERT INTO fines (fine_id, vehicle_no, vehicle_type, violations, amount, 
                         officer_id, officer_name, location, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fineId,
        fineData.vehicle_no.toUpperCase(),
        fineData.vehicle_type,
        JSON.stringify(violations),
        amount,
        fineData.officer_id || '',
        fineData.officer_name || '',
        fineData.location || '',
        fineData.notes || ''
      ]
    );

    return await this.findById(fineId);
  }

  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM fines WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.vehicleNo) {
      sql += ' AND vehicle_no LIKE ?';
      params.push(`%${filters.vehicleNo.toUpperCase()}%`);
    }

    if (filters.startDate) {
      sql += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      const offset = filters.offset || 0;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(filters.limit, offset);
    }

    return await all(sql, params);
  }

  static async getPaidFines(userId) {
    return await all(
      `SELECT f.* FROM fines f
       INNER JOIN payments p ON f.fine_id = p.fine_id
       WHERE p.paid_by = ? AND f.status = 'paid'
       ORDER BY f.created_at DESC`,
      [userId]
    );
  }

  static async update(fineId, updateData) {
    let sql = 'UPDATE fines SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (updateData.status) {
      sql += ', status = ?';
      params.push(updateData.status);
      if (updateData.status === 'paid') {
        sql += ', paid_at = CURRENT_TIMESTAMP';
      }
    }

    if (updateData.notes) {
      sql += ', notes = ?';
      params.push(updateData.notes);
    }

    if (updateData.image_path) {
      sql += ', image_path = ?';
      params.push(updateData.image_path);
    }

    sql += ' WHERE fine_id = ?';
    params.push(fineId);

    await run(sql, params);
    return await this.findById(fineId);
  }

  static async delete(fineId) {
    await run('DELETE FROM fines WHERE fine_id = ?', [fineId]);
  }

  static async getStats() {
    const totalFines = await get('SELECT COUNT(*) as count FROM fines');
    const pendingFines = await get("SELECT COUNT(*) as count FROM fines WHERE status = 'pending'");
    const paidFines = await get("SELECT COUNT(*) as count FROM fines WHERE status = 'paid'");
    const totalCollected = await get("SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE status = 'paid'");

    return {
      total: totalFines.count,
      pending: pendingFines.count,
      paid: paidFines.count,
      collected: totalCollected.total
    };
  }
}

module.exports = Fine;
      .input('imageUrl', sql.NVarChar, fineData.image_url)
      .input('location', sql.NVarChar, fineData.location)
      .input('officerId', sql.NVarChar, fineData.officer_id)
      .input('officerName', sql.NVarChar, fineData.officer_name)
      .input('notes', sql.NVarChar, fineData.notes)
      .query(`
        INSERT INTO Fines (fine_id, vehicle_no, vehicle_type, violations, amount, image_url, location, officer_id, officer_name, notes)
        VALUES (@fineId, @vehicleNo, @vehicleType, @violations, @amount, @imageUrl, @location, @officerId, @officerName, @notes);
        SELECT * FROM Fines WHERE fine_id = @fineId;
      `);
    return result.recordset[0];
  }

  static async updateStatus(fineId, status, paidAt = null) {
    const pool = await getConnection();
    let query = `
      UPDATE Fines 
      SET status = @status, updated_at = GETDATE()
    `;
    
    if (paidAt) {
      query += ', paid_at = @paidAt';
    }
    
    query += ' WHERE fine_id = @fineId; SELECT * FROM Fines WHERE fine_id = @fineId;';
    
    const request = pool.request()
      .input('fineId', sql.NVarChar, fineId)
      .input('status', sql.NVarChar, status);
    
    if (paidAt) {
      request.input('paidAt', sql.DateTime2, paidAt);
    }
    
    const result = await request.query(query);
    return result.recordset[0];
  }

  static async getAll(filters = {}) {
    const pool = await getConnection();
    let query = 'SELECT * FROM Fines WHERE 1=1';
    const request = pool.request();
    
    if (filters.status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar, filters.status);
    }
    
    if (filters.vehicleNo) {
      query += ' AND vehicle_no LIKE @vehicleNo';
      request.input('vehicleNo', sql.NVarChar, `%${filters.vehicleNo}%`);
    }
    
    if (filters.fromDate) {
      query += ' AND created_at >= @fromDate';
      request.input('fromDate', sql.DateTime2, new Date(filters.fromDate));
    }
    
    if (filters.toDate) {
      query += ' AND created_at <= @toDate';
      request.input('toDate', sql.DateTime2, new Date(filters.toDate));
    }
    
    if (filters.violation) {
      query += ' AND violations LIKE @violation';
      request.input('violation', sql.NVarChar, `%${filters.violation}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    // Pagination
    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, filters.offset || 0);
      request.input('limit', sql.Int, filters.limit);
    }
    
    const result = await request.query(query);
    return result.recordset;
  }

  static async getStats() {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as total_fines,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected_amount
      FROM Fines
    `);
    return result.recordset[0];
  }

  static async getViolationStats() {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT violations FROM Fines
    `);
    
    // Parse and count violations
    const violationCounts = {};
    result.recordset.forEach(row => {
      try {
        const violations = JSON.parse(row.violations);
        violations.forEach(v => {
          violationCounts[v] = (violationCounts[v] || 0) + 1;
        });
      } catch (e) {}
    });
    
    return Object.entries(violationCounts)
      .map(([code, count]) => ({
        code,
        name: VIOLATION_TYPES[code]?.name || code,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }

  static async getRecentFines(limit = 10) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) * FROM Fines 
        ORDER BY created_at DESC
      `);
    return result.recordset;
  }

  static async getRepeatOffenders(minFines = 3) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('minFines', sql.Int, minFines)
      .query(`
        SELECT 
          vehicle_no,
          vehicle_type,
          COUNT(*) as fine_count,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          MAX(created_at) as last_fine_date
        FROM Fines
        GROUP BY vehicle_no, vehicle_type
        HAVING COUNT(*) >= @minFines
        ORDER BY fine_count DESC
      `);
    return result.recordset;
  }

  static async getDailyStats(days = 30) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        SELECT 
          CAST(created_at AS DATE) as date,
          COUNT(*) as fine_count,
          SUM(amount) as total_amount
        FROM Fines
        WHERE created_at >= DATEADD(day, -@days, GETDATE())
        GROUP BY CAST(created_at AS DATE)
        ORDER BY date DESC
      `);
    return result.recordset;
  }
}

module.exports = Fine;
