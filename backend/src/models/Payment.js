const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../config/database');

class Payment {
  static async create(paymentData) {
    const paymentId = `PAY-${Date.now()}-${uuidv4().substring(0, 8)}`;

    await run(
      `INSERT INTO payments (payment_id, fine_id, amount, payment_method, transaction_id, paid_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        paymentData.fine_id,
        paymentData.amount,
        paymentData.payment_method || 'online',
        paymentData.transaction_id || `TXN-${Math.random().toString(36).substring(7)}`,
        paymentData.paid_by,
        paymentData.status || 'completed'
      ]
    );

    // Update fine status to paid
    await run(
      'UPDATE fines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE fine_id = ?',
      ['paid', paymentData.fine_id]
    );

    return await this.findById(paymentId);
  }

  static async findById(paymentId) {
    return await get('SELECT * FROM payments WHERE payment_id = ?', [paymentId]);
  }

  static async findByFineId(fineId) {
    return await get('SELECT * FROM payments WHERE fine_id = ?', [fineId]);
  }

  static async findByUserId(userId) {
    return await all(
      `SELECT p.*, f.vehicle_no, f.violations, f.amount as fine_amount
       FROM payments p
       INNER JOIN fines f ON p.fine_id = f.fine_id
       WHERE p.paid_by = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
  }

  static async findAllPayments(filters = {}) {
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.paidBy) {
      sql += ' AND paid_by = ?';
      params.push(filters.paidBy);
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

    return await all(sql, params);
  }

  static async getStats() {
    const totalPayments = await get('SELECT COUNT(*) as count FROM payments');
    const totalAmount = await get('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
    const completedPayments = await get(
      "SELECT COUNT(*) as count FROM payments WHERE status = 'completed'"
    );

    return {
      total_payments: totalPayments.count,
      total_amount: totalAmount.total,
      completed_payments: completedPayments.count,
      average_payment: totalPayments.count > 0 ? totalAmount.total / totalPayments.count : 0
    };
  }
}

module.exports = Payment;
        SUM(amount) as total_collected,
        COUNT(DISTINCT paid_by) as unique_payers
      FROM Payments
    `);
    return result.recordset[0];
  }

  static async getRecentPayments(limit = 10) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) p.*, f.vehicle_no, f.violations
        FROM Payments p
        JOIN Fines f ON p.fine_id = f.fine_id
        ORDER BY p.created_at DESC
      `);
    return result.recordset;
  }
}

module.exports = Payment;
