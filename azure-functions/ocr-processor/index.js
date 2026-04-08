const sql = require('mssql');

// Database configuration
const dbConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Computer Vision configuration
const cvEndpoint = process.env.AZURE_CV_ENDPOINT;
const cvKey = process.env.AZURE_CV_KEY;

/**
 * Azure Function: OCR Processor
 * Triggered when a new image is uploaded to Blob Storage
 * Extracts vehicle number plate using Computer Vision OCR
 */
module.exports = async function (context, myBlob) {
  context.log('OCR Processor triggered for blob:', context.bindingData.name);
  
  const blobName = context.bindingData.name;
  const blobUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/vehicle-images/${blobName}`;
  
  try {
    // Call Computer Vision OCR
    const ocrResult = await performOCR(blobUrl, context);
    
    // Extract number plate from OCR result
    const numberPlate = extractNumberPlate(ocrResult, context);
    
    // Prepare result
    const result = {
      blobName,
      blobUrl,
      processedAt: new Date().toISOString(),
      ocrResult: {
        rawText: ocrResult.rawText || [],
        extractedPlate: numberPlate,
        confidence: numberPlate ? 0.8 : 0.0
      }
    };
    
    // Store OCR result (if needed for audit)
    if (numberPlate) {
      await updateDatabase(blobUrl, numberPlate, context);
    }
    
    // Output to blob for logging
    context.bindings.outputBlob = JSON.stringify(result, null, 2);
    
    context.log('OCR processing completed:', result);
    
  } catch (error) {
    context.log.error('OCR processing error:', error);
    
    // Output error to blob
    context.bindings.outputBlob = JSON.stringify({
      blobName,
      blobUrl,
      error: error.message,
      processedAt: new Date().toISOString()
    }, null, 2);
  }
};

/**
 * Perform OCR using Azure Computer Vision
 */
async function performOCR(imageUrl, context) {
  if (!cvEndpoint || !cvKey) {
    throw new Error('Computer Vision not configured');
  }
  
  const analyzeUrl = `${cvEndpoint}vision/v3.2/read/analyze`;
  
  // Start the read operation
  const response = await fetch(analyzeUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': cvKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: imageUrl })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OCR API error: ${error}`);
  }
  
  const operationLocation = response.headers.get('Operation-Location');
  
  if (!operationLocation) {
    throw new Error('No operation location returned');
  }
  
  // Poll for results
  let result = null;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    await sleep(1000);
    
    const resultResponse = await fetch(operationLocation, {
      headers: {
        'Ocp-Apim-Subscription-Key': cvKey
      }
    });
    
    result = await resultResponse.json();
    
    if (result.status === 'succeeded') {
      break;
    } else if (result.status === 'failed') {
      throw new Error('OCR operation failed');
    }
    
    attempts++;
  }
  
  if (!result || result.status !== 'succeeded') {
    throw new Error('OCR operation timed out');
  }
  
  // Extract text lines
  const rawText = [];
  if (result.analyzeResult && result.analyzeResult.readResults) {
    result.analyzeResult.readResults.forEach(page => {
      page.lines.forEach(line => {
        rawText.push(line.text);
      });
    });
  }
  
  return { rawText, fullResult: result };
}

/**
 * Extract vehicle number plate from OCR text
 */
function extractNumberPlate(ocrResult, context) {
  const patterns = [
    /^[A-Z]{2}\s*[0-9]{1,2}\s*[A-Z]{1,3}\s*[0-9]{1,4}$/i,
    /^[A-Z]{3}\s*[0-9]{4}$/i,
    /^[0-9]{2}\s*BH\s*[0-9]{4}\s*[A-Z]{1,2}$/i,
    /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i
  ];
  
  for (const line of ocrResult.rawText || []) {
    const cleaned = line.replace(/\s+/g, '').toUpperCase();
    
    for (const pattern of patterns) {
      if (pattern.test(cleaned) || pattern.test(line.toUpperCase())) {
        return normalizeNumberPlate(cleaned);
      }
    }
  }
  
  // Try general pattern matching
  for (const line of ocrResult.rawText || []) {
    const cleaned = line.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length >= 8 && cleaned.length <= 12) {
      if (/^[A-Z]{2,3}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/.test(cleaned)) {
        return normalizeNumberPlate(cleaned);
      }
    }
  }
  
  return null;
}

/**
 * Normalize number plate format
 */
function normalizeNumberPlate(plate) {
  let normalized = plate.replace(/\s+/g, '').toUpperCase();
  
  if (normalized.length >= 9) {
    const match = normalized.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
  }
  
  return normalized;
}

/**
 * Update database with OCR result (optional - for associating images with pending fines)
 */
async function updateDatabase(blobUrl, numberPlate, context) {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Update any pending fines that match this image URL but don't have a vehicle number
    await pool.request()
      .input('blobUrl', sql.NVarChar, blobUrl)
      .input('vehicleNo', sql.NVarChar, numberPlate)
      .query(`
        UPDATE Fines 
        SET vehicle_no = @vehicleNo, updated_at = GETDATE()
        WHERE image_url = @blobUrl AND vehicle_no IS NULL
      `);
    
    await pool.close();
    context.log(`Updated database for plate: ${numberPlate}`);
  } catch (error) {
    context.log.error('Database update error:', error);
    // Don't throw - database update is optional
  }
}

/**
 * Helper function for async sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
