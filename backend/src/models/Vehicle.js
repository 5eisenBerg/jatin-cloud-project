const { run, get, all } = require('../config/database');

class Vehicle {
  static async findByVehicleNo(vehicleNo) {
    return await get(
      'SELECT * FROM vehicles WHERE vehicle_no = ?',
      [vehicleNo.toUpperCase().replace(/\s/g, '')]
    );
  }

  static async findByUserId(userId) {
    return await all(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY registered_at DESC',
      [userId]
    );
  }

  static async create(vehicleData) {
    const vehicleNo = vehicleData.vehicle_no.toUpperCase().replace(/\s/g, '');

    await run(
      `INSERT INTO vehicles (vehicle_no, vehicle_type, user_id, owner_name)
       VALUES (?, ?, ?, ?)`,
      [
        vehicleNo,
        vehicleData.vehicle_type,
        vehicleData.user_id || '',
        vehicleData.owner_name || ''
      ]
    );

    return await this.findByVehicleNo(vehicleNo);
  }

  static async upsert(vehicleData) {
    const vehicleNo = vehicleData.vehicle_no.toUpperCase().replace(/\s/g, '');

    // Check if vehicle exists
    const existing = await this.findByVehicleNo(vehicleNo);

    if (existing) {
      // Update if user_id is provided and vehicle has no owner
      if (vehicleData.user_id && !existing.user_id) {
        await run(
          'UPDATE vehicles SET user_id = ? WHERE vehicle_no = ?',
          [vehicleData.user_id, vehicleNo]
        );
      }
      return await this.findByVehicleNo(vehicleNo);
    }

    return this.create(vehicleData);
  }

  static async findAll() {
    return await all('SELECT * FROM vehicles ORDER BY registered_at DESC');
  }

  static async linkToUser(vehicleNo, userId) {
    await run(
      'UPDATE vehicles SET user_id = ? WHERE vehicle_no = ?',
      [userId, vehicleNo.toUpperCase().replace(/\s/g, '')]
    );

    return await this.findByVehicleNo(vehicleNo);
  }

  static async search(query) {
    return await all(
      `SELECT * FROM vehicles 
       WHERE vehicle_no LIKE ? OR owner_name LIKE ?
       ORDER BY registered_at DESC`,
      [`%${query}%`, `%${query}%`]
    );
  }

  static async getVehicleStats(vehicleNo) {
    const vehicle = await get('SELECT * FROM vehicles WHERE vehicle_no = ?', [vehicleNo]);
    if (!vehicle) return null;

    const fines = await all(
      'SELECT * FROM fines WHERE vehicle_no = ?',
      [vehicleNo]
    );

    const totalFines = fines.length;
    const pendingFines = fines.filter(f => f.status === 'pending').length;
    const paidFines = fines.filter(f => f.status === 'paid').length;
    const totalAmount = fines.reduce((sum, f) => sum + parseFloat(f.amount), 0);
    const pendingAmount = fines
      .filter(f => f.status === 'pending')
      .reduce((sum, f) => sum + parseFloat(f.amount), 0);

    return {
      ...vehicle,
      stats: {
        total_fines: totalFines,
        pending_fines: pendingFines,
        paid_fines: paidFines,
        total_amount: totalAmount,
        pending_amount: pendingAmount
      }
    };
  }
}

module.exports = Vehicle;
        ORDER BY registered_at DESC
      `);
    return result.recordset;
  }
}

module.exports = Vehicle;
