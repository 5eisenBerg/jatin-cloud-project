import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  DirectionsCar as CarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { vehicleService, fineService } from '../../services/api';
import { format } from 'date-fns';

function VehicleSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [fines, setFines] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a vehicle number');
      return;
    }

    setLoading(true);
    setError(null);
    setVehicleData(null);
    setFines([]);

    try {
      // Get vehicle history
      const historyResponse = await vehicleService.getHistory(searchQuery);
      const { vehicle, fines: vehicleFines } = historyResponse.data.data;
      setVehicleData(vehicle);
      setFines(vehicleFines || []);
    } catch (err) {
      if (err.status === 404) {
        setError('Vehicle not found in the system');
      } else {
        setError(err.message || 'Failed to search vehicle');
      }
      // Show mock data for development
      setVehicleData({
        vehicle_no: searchQuery.toUpperCase(),
        vehicle_type: 'Car',
        total_fines: 5,
        pending_fines: 2,
        paid_fines: 3,
        total_amount: 15000,
        pending_amount: 6000,
      });
      setFines([
        {
          fine_id: 'FN-001',
          violations: '["SIGNAL_JUMP"]',
          amount: 1000,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        {
          fine_id: 'FN-002',
          violations: '["NO_HELMET","TRIPLE_RIDING"]',
          amount: 2000,
          status: 'paid',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const parseViolations = (violations) => {
    try {
      const parsed = typeof violations === 'string' ? JSON.parse(violations) : violations;
      return parsed.join(', ').replace(/_/g, ' ');
    } catch {
      return violations;
    }
  };

  const isRepeatOffender = vehicleData?.total_fines >= 3;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Vehicle Search
      </Typography>

      {/* Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ height: 56 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error} - Showing sample data
        </Alert>
      )}

      {/* Vehicle Details */}
      {vehicleData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CarIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {vehicleData.vehicle_no}
                    </Typography>
                    <Typography color="text.secondary">
                      {vehicleData.vehicle_type || 'Unknown Type'}
                    </Typography>
                  </Box>
                </Box>

                {isRepeatOffender && (
                  <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                    Repeat Offender ({vehicleData.total_fines} fines)
                  </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total Fines
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {vehicleData.total_fines || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {vehicleData.pending_fines || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      ₹{(vehicleData.total_amount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Pending Amount
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="error.main">
                      ₹{(vehicleData.pending_amount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Fine History
                </Typography>

                {fines.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography color="text.secondary">
                      No fines found for this vehicle
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fine ID</TableCell>
                          <TableCell>Violations</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fines.map((fine) => (
                          <TableRow key={fine.fine_id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {fine.fine_id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {parseViolations(fine.violations)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={600}>₹{fine.amount}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={fine.status}
                                size="small"
                                color={fine.status === 'paid' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              {format(new Date(fine.created_at), 'dd MMM yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Empty State */}
      {!vehicleData && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CarIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Search for a Vehicle
          </Typography>
          <Typography color="text.secondary">
            Enter a vehicle number to view its history and pending fines
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default VehicleSearch;
