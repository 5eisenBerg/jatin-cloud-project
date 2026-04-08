import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Typography,
  Alert,
  Stack
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import api from '../../services/api';

function PhotoUploadComponent({ onUploadSuccess, label = 'Upload Photo', allowPublic = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Please select a valid image file (JPEG or PNG)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Choose endpoint based on allowPublic flag
      const endpoint = allowPublic ? '/api/upload/vehicle-photo' : '/api/upload/image';
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedData(response.data.data);
      setSelectedFile(null);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card
      sx={{
        border: '2px dashed #ccc',
        borderRadius: 2,
        p: 2,
        backgroundColor: '#fafafa'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Stack spacing={2}>
          {/* Upload Area */}
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              cursor: 'pointer',
              border: '2px dashed #bbb',
              borderRadius: 1,
              backgroundColor: 'white',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: '#f5f5f5'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={loading}
            />

            {!preview && !uploadedData && (
              <>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  {label}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click to browse or drag and drop
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  (JPEG, PNG • Max 10MB)
                </Typography>
              </>
            )}

            {preview && !uploadedData && (
              <Box>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 250,
                    borderRadius: 4,
                    marginBottom: 16
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  {selectedFile?.name}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Error Message */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Success Message */}
          {uploadedData && (
            <Alert severity="success" icon={<CheckIcon />}>
              Image uploaded successfully!
            </Alert>
          )}

          {/* Action Buttons */}
          {!uploadedData && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Upload'}
              </Button>
              {selectedFile && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClear}
                  disabled={loading}
                  startIcon={<CloseIcon />}
                >
                  Clear
                </Button>
              )}
            </Box>
          )}

          {uploadedData && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<CheckIcon />}
              >
                Image Ready
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                fullWidth
              >
                Upload Another
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PhotoUploadComponent;
