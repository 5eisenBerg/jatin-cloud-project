const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

// Pay a fine
router.post('/:fineId/pay', authenticate, [
  body('payment_method').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { fineId } = req.params;
  const { payment_method } = req.body;

  // Get the fine
  const fine = await Fine.findById(fineId);
  if (!fine) {
    throw new AppError('Fine not found', 404);
  }

  if (fine.status === 'paid') {
    throw new AppError('Fine has already been paid', 400);
  }

  // Create payment record (which auto-updates fine status)
  const payment = await Payment.create({
    fine_id: fineId,
    amount: fine.amount,
    payment_method: payment_method || 'online',
    paid_by: req.user.id
  });

  res.json({
    success: true,
    message: 'Payment successful',
    data: payment
  });
}));

// Get user's payment history
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const payments = await Payment.findByUserId(req.user.id);

  res.json({
    success: true,
    data: payments
  });
}));

// Get payment by fine ID
router.get('/:fineId', asyncHandler(async (req, res) => {
  const { fineId } = req.params;

  const payment = await Payment.findByFineId(fineId);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  res.json({
    success: true,
    data: payment
  });
}));

// Get all payments (admin only)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const payments = await Payment.findAllPayments();

  res.json({
    success: true,
    data: payments
  });
}));

// Get payment statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const stats = await Payment.getStats();

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;
    }
  });
}));

// Get user's payment history
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const payments = await Payment.findByUserId(req.user.id);
  
  res.json({
    success: true,
    data: payments
  });
}));

// Get payment by fine ID
router.get('/fine/:fineId', asyncHandler(async (req, res) => {
  const { fineId } = req.params;
  
  const payment = await Payment.findByFineId(fineId);
  
  res.json({
    success: true,
    data: payment
  });
}));

// Simulate payment verification (for demo purposes)
router.post('/verify', asyncHandler(async (req, res) => {
  const { transaction_id } = req.body;
  
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  res.json({
    success: true,
    data: {
      verified: true,
      transaction_id,
      timestamp: new Date().toISOString()
    }
  });
}));

module.exports = router;
