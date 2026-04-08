import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  DirectionsCar as CarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { fineService, uploadService, vehicleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const VIOLATION_NAMES = {
  SIGNAL_JUMP: 'Signal Jump',
  NO_HELMET: 'No Helmet',
  NO_SEATBELT: 'No Seatbelt',
  USING_MOBILE: 'Using Mobile',
  TRIPLE_RIDING: 'Triple Riding',
  RASH_DRIVING: 'Rash Driving',
  OVER_SPEEDING: 'Over Speeding',
  WRONG_SIDE: 'Wrong Side Driving',
  NO_LICENSE: 'No License',
  NO_INSURANCE: 'No Insurance',
  NO_PUC: 'No PUC',
  EXPIRED_REGISTRATION: 'Expired Registration',
  DRUNK_DRIVING: 'Drunk Driving',
  HIT_AND_RUN: 'Hit and Run',
  ACCIDENT: 'Accident',
};

function CheckFines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleSearch = async (vehicleNo) => {
    const searchValue = vehicleNo || searchQuery;
    if (!searchValue.trim()) {
      setError('Please enter a vehicle number');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const response = await fineService.getByVehicle(searchValue);
      setSearchResult(response.data.data);
    } catch (err) {
      if (err.status === 404) {
        // Vehicle not found - no fines
        setSearchResult({
          vehicle: { vehicle_no: searchValue.toUpperCase() },
          fines: [],
          summary: { total: 0, pending: 0, totalAmount: 0 },
        });
      } else {
        setError(err.message || 'Failed to search vehicle');
        // Mock data for development
        setSearchResult({
          vehicle: { vehicle_no: searchValue.toUpperCase(), vehicle_type: 'Car' },
          fines: [
            {
              fine_id: 'FN-001',
              violations: '["SIGNAL_JUMP"]',
              amount: 1000,
              status: 'pending',
              created_at: new Date().toISOString(),
            },
            {
              fine_id: 'FN-002',
              violations: '["NO_HELMET"]',
              amount: 1000,
              status: 'paid',
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
          summary: { total: 2, pending: 1, totalAmount: 1000 },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setOcrProcessing(true);
      setError(null);

      try {
        const response = await uploadService.uploadWithOCR(file);
        const { ocr } = response.data.data;
        if (ocr.numberPlate) {
          setSearchQuery(ocr.numberPlate);
          await handleSearch(ocr.numberPlate);
        } else {
          setError('Could not detect number plate from image. Please enter manually.');
        }
      } catch (err) {
        setError('OCR processing failed. Please enter vehicle number manually.');
      } finally {
        setOcrProcessing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const parseViolations = (violations) => {
    try {
      const parsed = typeof violations === 'string' ? JSON.parse(violations) : violations;
      return parsed.map(v => VIOLATION_NAMES[v] || v).join(', ');
    } catch {
      return violations;
    }
  };

  const handleLinkVehicle = async () => {
    if (!searchResult?.vehicle?.vehicle_no) return;

    try {
      await vehicleService.linkToUser(searchResult.vehicle.vehicle_no);
      setError(null);
      alert('Vehicle linked to your account successfully!');
    } catch (err) {
      setError(err.message || 'Failed to link vehicle');
    }
  };

  const pendingFines = searchResult?.fines?.filter(f => f.status === 'pending') || [];
  const paidFines = searchResult?.fines?.filter(f => f.status === 'paid') || [];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Check Fines
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search by Vehicle Number
              </Typography>
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    placeholder="Enter vehicle number (e.g., MH 12 AB 1234)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  >
                    {loading ? 'Searching...' : 'Search Fines'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Vehicle Image
              </Typography>
              <Paper
                {...getRootProps()}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  bgcolor: isDragActive ? 'primary.50' : 'grey.50',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                  position: 'relative',
                }}
              >
                <input {...getInputProps()} />
                {ocrProcessing ? (
                  <Box>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Processing image...</Typography>
                  </Box>
                ) : imagePreview ? (
                  <Box>
                    <img
                      src={imagePreview}
                      alt="Vehicle"
                      style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }}
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Click or drop to change image
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <UploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                    <Typography>
                      {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      We'll extract the number plate automatically
                    </Typography>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Results */}
      {searchResult && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center">
                <CarIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {searchResult.vehicle?.vehicle_no}
                  </Typography>
                  <Typography color="text.secondary">
                    {searchResult.vehicle?.vehicle_type || 'Vehicle'}
                  </Typography>
                </Box>
              </Box>
              <Button variant="outlined" onClick={handleLinkVehicle}>
                Link to My Account
              </Button>
            </Box>

            {/* Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h4" fontWeight={700}>
                    {searchResult.fines?.length || 0}
                  </Typography>
                  <Typography color="text.secondary">Total Fines</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Typography variant="h4" fontWeight={700} color="warning.dark">
                    {pendingFines.length}
                  </Typography>
                  <Typography color="warning.dark">Pending</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    ₹{searchResult.summary?.totalAmount?.toLocaleString() || 0}
                  </Typography>
                  <Typography color="error.main">Amount Due</Typography>
                </Paper>
              </Grid>
            </Grid>

            {searchResult.fines?.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'success.50' }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.dark">
                  No fines found for this vehicle!
                </Typography>
              </Paper>
            ) : (
              <>
                {/* Pending Fines */}
                {pendingFines.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      <WarningIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
                      Pending Fines ({pendingFines.length})
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Fine ID</TableCell>
                            <TableCell>Violations</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingFines.map((fine) => (
                            <TableRow key={fine.fine_id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {fine.fine_id.substring(0, 15)}...
                                </Typography>
                              </TableCell>
                              <TableCell>{parseViolations(fine.violations)}</TableCell>
                              <TableCell align="right">
                                <Typography fontWeight={700} color="error">
                                  ₹{fine.amount}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {format(new Date(fine.created_at), 'dd MMM yyyy')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/user/my-fines')}
                      >
                        Pay Pending Fines
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Paid Fines */}
                {paidFines.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                      Paid Fines ({paidFines.length})
                    </Typography>
                    <TableContainer component={Paper} sx={{ bgcolor: 'grey.50' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Fine ID</TableCell>
                            <TableCell>Violations</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paidFines.map((fine) => (
                            <TableRow key={fine.fine_id}>
                              <TableCell>
                                <Typography variant="body2">
                                  {fine.fine_id.substring(0, 15)}...
                                </Typography>
                              </TableCell>
                              <TableCell>{parseViolations(fine.violations)}</TableCell>
                              <TableCell align="right">₹{fine.amount}</TableCell>
                              <TableCell>
                                {format(new Date(fine.created_at), 'dd MMM yyyy')}
                              </TableCell>
                              <TableCell>
                                <Chip label="Paid" size="small" color="success" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!searchResult && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CarIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Check Your Vehicle Fines
          </Typography>
          <Typography color="text.secondary">
            Enter your vehicle number or upload an image to check for any pending fines
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default CheckFines;
