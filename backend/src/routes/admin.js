const express = require('express');
const router = express.Router();
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [fineStats, violationStats, dailyStats, recentFines, repeatOffenders, paymentStats] = await Promise.all([
    Fine.getStats(),
    Fine.getViolationStats(),
    Fine.getDailyStats(30),
    Fine.getRecentFines(5),
    Fine.getRepeatOffenders(3),
    Payment.getStats()
  ]);
  
  res.json({
    success: true,
    data: {
      overview: {
        totalFines: fineStats.total_fines || 0,
        pendingFines: fineStats.pending_count || 0,
        paidFines: fineStats.paid_count || 0,
        totalAmount: parseFloat(fineStats.total_amount) || 0,
        pendingAmount: parseFloat(fineStats.pending_amount) || 0,
        collectedAmount: parseFloat(fineStats.collected_amount) || 0,
        totalPayments: paymentStats.total_payments || 0,
        totalCollected: parseFloat(paymentStats.total_collected) || 0
      },
      topViolations: violationStats.slice(0, 10),
      dailyTrends: dailyStats,
      recentFines,
      repeatOffenders
    }
  });
}));

// Get all users (admin only)
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  
  res.json({
    success: true,
    data: users
  });
}));

// Get repeat offenders
router.get('/offenders', asyncHandler(async (req, res) => {
  const { minFines = 2 } = req.query;
  
  const offenders = await Fine.getRepeatOffenders(parseInt(minFines));
  
  res.json({
    success: true,
    data: offenders
  });
}));

// Get fine statistics
router.get('/stats/fines', asyncHandler(async (req, res) => {
  const stats = await Fine.getStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

// Get violation statistics
router.get('/stats/violations', asyncHandler(async (req, res) => {
  const stats = await Fine.getViolationStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

// Get daily statistics
router.get('/stats/daily', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const stats = await Fine.getDailyStats(parseInt(days));
  
  res.json({
    success: true,
    data: stats
  });
}));

// Get recent payments
router.get('/payments/recent', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const payments = await Payment.getRecentPayments(parseInt(limit));
  
  res.json({
    success: true,
    data: payments
  });
}));

module.exports = router;
