const { getBlobServiceClient } = require('../config/azure');
const { v4: uuidv4 } = require('uuid');

const containerName = process.env.AZURE_STORAGE_CONTAINER || 'vehicle-images';

class BlobService {
  static async uploadImage(buffer, originalName, mimeType) {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access for images
    });
    
    // Generate unique blob name
    const extension = originalName.split('.').pop();
    const blobName = `${Date.now()}-${uuidv4()}.${extension}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    });
    
    return blockBlobClient.url;
  }

  static async deleteImage(blobUrl) {
    try {
      const blobServiceClient = getBlobServiceClient();
      const containerClient = blobServiceClient.getContainerClient(containerName);
      
      // Extract blob name from URL
      const url = new URL(blobUrl);
      const blobName = url.pathname.split('/').pop();
      
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      
      return true;
    } catch (error) {
      console.error('Error deleting blob:', error);
      return false;
    }
  }

  static async generateSasUrl(blobUrl, expiresInMinutes = 60) {
    const { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
    
    const url = new URL(blobUrl);
    const blobName = url.pathname.split('/').pop();
    
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Generate SAS token
    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);
    
    const sasUrl = await blockBlobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse('r'),
      startsOn,
      expiresOn
    });
    
    return sasUrl;
  }
}

module.exports = BlobService;
