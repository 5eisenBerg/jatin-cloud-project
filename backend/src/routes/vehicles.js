const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const Fine = require('../models/Fine');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { VEHICLE_TYPES } = require('../config/constants');

// Get user's vehicles
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.findByUserId(req.user.id);
  
  res.json({
    success: true,
    data: vehicles
  });
}));

// Search vehicles
router.get('/search', authenticate, asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }
  
  const vehicles = await Vehicle.search(q);
  
  res.json({
    success: true,
    data: vehicles
  });
}));

// Get vehicle by number
router.get('/:vehicleNo', asyncHandler(async (req, res) => {
  const { vehicleNo } = req.params;
  
  const vehicle = await Vehicle.findByVehicleNo(vehicleNo);
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }
  
  res.json({
    success: true,
    data: vehicle
  });
}));

// Get vehicle history with fines
router.get('/:vehicleNo/history', asyncHandler(async (req, res) => {
  const { vehicleNo } = req.params;
  
  const vehicleHistory = await Vehicle.getVehicleHistory(vehicleNo);
  if (!vehicleHistory) {
    throw new AppError('Vehicle not found', 404);
  }
  
  const fines = await Fine.findByVehicleNo(vehicleNo);
  
  res.json({
    success: true,
    data: {
      vehicle: vehicleHistory,
      fines
    }
  });
}));

// Register/Add vehicle
router.post('/', authenticate, [
  body('vehicle_no').notEmpty().trim().toUpperCase(),
  body('vehicle_type').notEmpty().isIn(Object.values(VEHICLE_TYPES))
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  
  const { vehicle_no, vehicle_type, owner_name } = req.body;
  
  // Check if vehicle already exists
  const existing = await Vehicle.findByVehicleNo(vehicle_no);
  if (existing && existing.user_id) {
    throw new AppError('Vehicle is already registered to another user', 400);
  }
  
  const vehicle = await Vehicle.upsert({
    vehicle_no,
    vehicle_type,
    user_id: req.user.id,
    owner_name: owner_name || req.user.name
  });
  
  res.status(201).json({
    success: true,
    data: vehicle
  });
}));

// Link existing vehicle to user
router.post('/:vehicleNo/link', authenticate, asyncHandler(async (req, res) => {
  const { vehicleNo } = req.params;
  
  const vehicle = await Vehicle.findByVehicleNo(vehicleNo);
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }
  
  if (vehicle.user_id && vehicle.user_id !== req.user.id) {
    throw new AppError('Vehicle is already linked to another user', 400);
  }
  
  const updatedVehicle = await Vehicle.linkToUser(vehicleNo, req.user.id);
  
  res.json({
    success: true,
    data: updatedVehicle
  });
}));

// Get vehicle types
router.get('/config/types', (req, res) => {
  res.json({
    success: true,
    data: Object.values(VEHICLE_TYPES)
  });
});

module.exports = router;
