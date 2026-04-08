const { getComputerVisionConfig } = require('../config/azure');

class OCRService {
  static async extractNumberPlate(imageUrl) {
    const config = getComputerVisionConfig();
    
    if (!config.endpoint || !config.key) {
      throw new Error('Computer Vision is not configured');
    }

    // Call Azure Computer Vision Read API
    const analyzeUrl = `${config.endpoint}vision/v3.2/read/analyze`;
    
    // Start the read operation
    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: imageUrl })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OCR API error: ${error}`);
    }

    // Get the operation location from headers
    const operationLocation = response.headers.get('Operation-Location');
    
    if (!operationLocation) {
      throw new Error('No operation location returned');
    }

    // Poll for results
    let result = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultResponse = await fetch(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': config.key
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

    // Extract text from results
    const extractedText = this.parseOCRResult(result);
    
    // Try to identify vehicle number plate
    const numberPlate = this.findNumberPlate(extractedText);
    
    return {
      rawText: extractedText,
      numberPlate,
      confidence: numberPlate ? 0.8 : 0.3
    };
  }

  static parseOCRResult(result) {
    const lines = [];
    
    if (result.analyzeResult && result.analyzeResult.readResults) {
      result.analyzeResult.readResults.forEach(page => {
        page.lines.forEach(line => {
          lines.push(line.text);
        });
      });
    }
    
    return lines;
  }

  static findNumberPlate(textLines) {
    // Indian vehicle number plate patterns
    const patterns = [
      // Standard format: XX 00 XX 0000 or XX00XX0000
      /^[A-Z]{2}\s*[0-9]{1,2}\s*[A-Z]{1,3}\s*[0-9]{1,4}$/i,
      // Older format: XXX 0000
      /^[A-Z]{3}\s*[0-9]{4}$/i,
      // BH series (Bharat series)
      /^[0-9]{2}\s*BH\s*[0-9]{4}\s*[A-Z]{1,2}$/i,
      // General pattern
      /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i
    ];

    for (const line of textLines) {
      // Remove spaces and clean up
      const cleaned = line.replace(/\s+/g, '').toUpperCase();
      
      for (const pattern of patterns) {
        if (pattern.test(cleaned) || pattern.test(line.toUpperCase())) {
          // Normalize the number plate
          return this.normalizeNumberPlate(cleaned);
        }
      }
    }

    // Try to find any text that looks like a number plate
    for (const line of textLines) {
      const cleaned = line.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (cleaned.length >= 8 && cleaned.length <= 12) {
        // Check if it has both letters and numbers in typical positions
        if (/^[A-Z]{2,3}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/.test(cleaned)) {
          return this.normalizeNumberPlate(cleaned);
        }
      }
    }

    return null;
  }

  static normalizeNumberPlate(plate) {
    // Remove all spaces and convert to uppercase
    let normalized = plate.replace(/\s+/g, '').toUpperCase();
    
    // Format as: XX 00 XX 0000
    if (normalized.length >= 9) {
      const match = normalized.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
    }
    
    return normalized;
  }

  static detectVehicleType(imageUrl) {
    // This would use Azure Custom Vision in a full implementation
    // For now, return a default
    return 'Car';
  }
}

module.exports = OCRService;
