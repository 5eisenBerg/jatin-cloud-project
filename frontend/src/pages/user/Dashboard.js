import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  DirectionsCar as CarIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fineService, vehicleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function StatCard({ title, value, icon, color, action }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={color}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color || 'primary'}.light`,
              color: 'white',
              opacity: 0.8,
            }}
          >
            {icon}
          </Box>
        </Box>
        {action && (
          <Box mt={2}>
            {action}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [pendingFines, setPendingFines] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    pendingFines: 0,
    totalPendingAmount: 0,
    paidFines: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's vehicles
      const vehiclesResponse = await vehicleService.getMyVehicles();
      const userVehicles = vehiclesResponse.data.data || [];
      setVehicles(userVehicles);

      // Get fines for each vehicle
      let allPendingFines = [];
      let totalPaid = 0;

      for (const vehicle of userVehicles) {
        const finesResponse = await fineService.getByVehicle(vehicle.vehicle_no);
        const vehicleFines = finesResponse.data.data.fines || [];
        const pending = vehicleFines.filter(f => f.status === 'pending');
        allPendingFines = [...allPendingFines, ...pending.map(f => ({ ...f, vehicle_no: vehicle.vehicle_no }))];
        totalPaid += vehicleFines.filter(f => f.status === 'paid').length;
      }

      setPendingFines(allPendingFines);
      setStats({
        totalVehicles: userVehicles.length,
        pendingFines: allPendingFines.length,
        totalPendingAmount: allPendingFines.reduce((sum, f) => sum + parseFloat(f.amount), 0),
        paidFines: totalPaid,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      // Mock data for development
      setVehicles([
        { vehicle_no: 'MH 12 AB 1234', vehicle_type: 'Car' },
        { vehicle_no: 'MH 12 CD 5678', vehicle_type: 'Bike' },
      ]);
      setPendingFines([
        { fine_id: 'FN-001', vehicle_no: 'MH 12 AB 1234', amount: 2000, violations: '["SIGNAL_JUMP","NO_SEATBELT"]' },
        { fine_id: 'FN-002', vehicle_no: 'MH 12 CD 5678', amount: 1000, violations: '["NO_HELMET"]' },
      ]);
      setStats({
        totalVehicles: 2,
        pendingFines: 2,
        totalPendingAmount: 3000,
        paidFines: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Welcome, {user?.name || 'User'}
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error} - Showing sample data
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Vehicles"
            value={stats.totalVehicles}
            icon={<CarIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Fines"
            value={stats.pendingFines}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Amount Due"
            value={`₹${stats.totalPendingAmount.toLocaleString()}`}
            icon={<PaymentIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid Fines"
            value={stats.paidFines}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Fines Alert */}
        {stats.pendingFines > 0 && (
          <Grid item xs={12}>
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate('/user/my-fines')}
                >
                  View & Pay
                </Button>
              }
            >
              You have {stats.pendingFines} pending fine(s) totaling ₹{stats.totalPendingAmount.toLocaleString()}. Pay now to avoid penalties.
            </Alert>
          </Grid>
        )}

        {/* My Vehicles */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  My Vehicles
                </Typography>
                <Button size="small" onClick={() => navigate('/user/check-fines')}>
                  Add Vehicle
                </Button>
              </Box>

              {vehicles.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <CarIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography color="text.secondary">
                    No vehicles registered yet
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/user/check-fines')}
                  >
                    Check & Add Vehicle
                  </Button>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {vehicles.map((vehicle) => (
                    <Paper key={vehicle.vehicle_no} sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center">
                          <CarIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography fontWeight={600}>{vehicle.vehicle_no}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.vehicle_type}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          onClick={() => navigate(`/user/my-fines?vehicle=${vehicle.vehicle_no}`)}
                        >
                          View Fines
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Pending Fines */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Pending Fines
                </Typography>
                <Button size="small" onClick={() => navigate('/user/my-fines')}>
                  View All
                </Button>
              </Box>

              {pendingFines.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.50' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography color="success.dark" fontWeight={500}>
                    No pending fines!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All your fines are paid
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {pendingFines.slice(0, 3).map((fine) => (
                    <Paper key={fine.fine_id} sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography fontWeight={600}>{fine.vehicle_no}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {fine.fine_id}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" color="error.main" fontWeight={700}>
                            ₹{fine.amount}
                          </Typography>
                          <Chip label="Pending" size="small" color="warning" />
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                  {pendingFines.length > 3 && (
                    <Button fullWidth onClick={() => navigate('/user/my-fines')}>
                      View All {pendingFines.length} Fines
                    </Button>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<CarIcon />}
                    onClick={() => navigate('/user/check-fines')}
                    sx={{ py: 2 }}
                  >
                    Check Fines by Vehicle
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={() => navigate('/user/my-fines')}
                    sx={{ py: 2 }}
                  >
                    Pay Pending Fines
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => navigate('/user/payments')}
                    sx={{ py: 2 }}
                  >
                    Payment History
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UserDashboard;
