const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Fine = require('../models/Fine');
const Vehicle = require('../models/Vehicle');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { VIOLATION_TYPES } = require('../config/constants');

// Validation middleware
const validateFine = [
  body('vehicle_no').notEmpty().trim().toUpperCase(),
  body('vehicle_type').notEmpty(),
  body('violations').isArray({ min: 1 }).withMessage('At least one violation is required')
];

// Get all fines (with filters) - Admin
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, vehicleNo, startDate, endDate, page = 1, limit = 20 } = req.query;
  
  const filters = {
    status,
    vehicleNo,
    startDate,
    endDate,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };
  
  const fines = await Fine.findAll(filters);
  
  res.json({
    success: true,
    data: fines,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
}));

// Get fines for a vehicle (public - for users checking their fines)
router.get('/vehicle/:vehicleNo', asyncHandler(async (req, res) => {
  const { vehicleNo } = req.params;
  const { status } = req.query;
  
  const fines = await Fine.findByVehicleNo(vehicleNo, status);
  const vehicle = await Vehicle.findByVehicleNo(vehicleNo);
  
  // Calculate totals
  const pending = fines.filter(f => f.status === 'pending');
  const totalPending = pending.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  
  res.json({
    success: true,
    data: {
      vehicle,
      fines,
      summary: {
        total: fines.length,
        pending: pending.length,
        totalAmount: totalPending
      }
    }
  });
}));

// Get single fine
router.get('/:fineId', asyncHandler(async (req, res) => {
  const { fineId } = req.params;
  
  const fine = await Fine.findById(fineId);
  if (!fine) {
    throw new AppError('Fine not found', 404);
  }
  
  res.json({
    success: true,
    data: fine
  });
}));

// Create new fine - Admin only
router.post('/', authenticate, requireAdmin, validateFine, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  
  const { vehicle_no, vehicle_type, violations, image_url, location, notes } = req.body;
  
  // Validate violations
  for (const v of violations) {
    if (!VIOLATION_TYPES[v]) {
      throw new AppError(`Invalid violation type: ${v}`, 400);
    }
  }
  
  // Ensure vehicle exists or create it
  await Vehicle.upsert({
    vehicle_no,
    vehicle_type
  });
  
  // Create the fine
  const fine = await Fine.create({
    vehicle_no,
    vehicle_type,
    violations,
    image_url,
    location,
    notes,
    officer_id: req.user.id,
    officer_name: req.user.name
  });
  
  res.status(201).json({
    success: true,
    data: fine
  });
}));

// Update fine status - Admin only
router.patch('/:fineId/status', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { fineId } = req.params;
  const { status } = req.body;

  if (!['pending', 'paid', 'cancelled'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const fine = await Fine.findById(fineId);
  if (!fine) {
    throw new AppError('Fine not found', 404);
  }

  const updatedFine = await Fine.update(fineId, { status });

  res.json({
    success: true,
    data: updatedFine
  });
}));

// Get violation types
router.get('/config/violations', (req, res) => {
  res.json({
    success: true,
    data: Object.values(VIOLATION_TYPES)
  });
});

module.exports = router;
