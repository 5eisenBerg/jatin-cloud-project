const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${uuidv4().substring(0, 8)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG and PNG files are allowed.', 400));
    }
  }
});

// Upload image and return path
router.post('/image', authenticate, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  const imagePath = `/api/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      path: imagePath,
      size: req.file.size,
      originalName: req.file.originalname
    }
  });
}));

// Upload image without authentication (for quick photo lookups)
router.post('/vehicle-photo', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  const imagePath = `/api/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      path: imagePath,
      size: req.file.size,
      originalName: req.file.originalname
    }
  });
}));

// Serve uploaded image
router.get('/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  // Validate filename (prevent directory traversal)
  if (filename.includes('..') || filename.includes('/')) {
    throw new AppError('Invalid filename', 400);
  }

  const filepath = path.join(uploadsDir, filename);

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    throw new AppError('Image not found', 404);
  }

  res.sendFile(filepath);
}));

// Delete image (admin only)
router.delete('/:filename', authenticate, asyncHandler(async (req, res) => {
  const { filename } = req.params;

  if (filename.includes('..') || filename.includes('/')) {
    throw new AppError('Invalid filename', 400);
  }

  const filepath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filepath)) {
    throw new AppError('Image not found', 404);
  }

  fs.unlinkSync(filepath);

  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
}));

module.exports = router;
  
  // Upload to blob storage first
  const imageUrl = await BlobService.uploadImage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );
  
  // Process with OCR
  let ocrResult;
  try {
    ocrResult = await OCRService.extractNumberPlate(imageUrl);
  } catch (error) {
    console.error('OCR Error:', error);
    ocrResult = {
      rawText: [],
      numberPlate: null,
      confidence: 0,
      error: error.message
    };
  }
  
  res.json({
    success: true,
    data: {
      imageUrl,
      ocr: ocrResult
    }
  });
}));

// Process existing image URL with OCR
router.post('/ocr/url', authenticate, asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    throw new AppError('Image URL is required', 400);
  }
  
  const ocrResult = await OCRService.extractNumberPlate(imageUrl);
  
  res.json({
    success: true,
    data: {
      ocr: ocrResult
    }
  });
}));

// Delete image
router.delete('/image', authenticate, asyncHandler(async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    throw new AppError('Image URL is required', 400);
  }
  
  await BlobService.deleteImage(url);
  
  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
}));

module.exports = router;
