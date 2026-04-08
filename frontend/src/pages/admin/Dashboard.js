import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
  LocalPolice as PoliceIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { adminService } from '../../services/api';
import { format } from 'date-fns';

const COLORS = ['#1565C0', '#FF6F00', '#2E7D32', '#D32F2F', '#9C27B0', '#00BCD4'];

function StatCard({ title, value, icon, color, subtitle }) {
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
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.contrastText`,
              opacity: 0.8,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      // Set mock data for development
      setDashboardData({
        overview: {
          totalFines: 1250,
          pendingFines: 450,
          paidFines: 800,
          totalAmount: 2500000,
          pendingAmount: 950000,
          collectedAmount: 1550000,
        },
        topViolations: [
          { code: 'SIGNAL_JUMP', name: 'Signal Jump', count: 320 },
          { code: 'NO_HELMET', name: 'No Helmet', count: 280 },
          { code: 'OVER_SPEEDING', name: 'Over Speeding', count: 210 },
          { code: 'NO_SEATBELT', name: 'No Seatbelt', count: 180 },
          { code: 'USING_MOBILE', name: 'Using Mobile', count: 150 },
        ],
        dailyTrends: Array.from({ length: 14 }, (_, i) => ({
          date: format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'MMM dd'),
          fine_count: Math.floor(Math.random() * 50) + 20,
          total_amount: Math.floor(Math.random() * 100000) + 50000,
        })).reverse(),
        recentFines: [
          { fine_id: 'FN-001', vehicle_no: 'MH 12 AB 1234', amount: 2000, status: 'pending', created_at: new Date() },
          { fine_id: 'FN-002', vehicle_no: 'MH 14 CD 5678', amount: 5000, status: 'paid', created_at: new Date() },
          { fine_id: 'FN-003', vehicle_no: 'MH 01 EF 9012', amount: 1000, status: 'pending', created_at: new Date() },
        ],
        repeatOffenders: [
          { vehicle_no: 'MH 12 AB 1234', fine_count: 8, total_amount: 25000 },
          { vehicle_no: 'MH 14 CD 5678', fine_count: 6, total_amount: 18000 },
        ],
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

  const { overview, topViolations, dailyTrends, recentFines, repeatOffenders } = dashboardData || {};

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dashboard Overview
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
            title="Total Fines"
            value={overview?.totalFines?.toLocaleString() || 0}
            icon={<PoliceIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Fines"
            value={overview?.pendingFines?.toLocaleString() || 0}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid Fines"
            value={overview?.paidFines?.toLocaleString() || 0}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue Collected"
            value={`₹${(overview?.collectedAmount / 100000)?.toFixed(1) || 0}L`}
            icon={<MoneyIcon />}
            color="info"
            subtitle={`Pending: ₹${(overview?.pendingAmount / 100000)?.toFixed(1) || 0}L`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Daily Trends Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Daily Fine Trends (Last 14 Days)
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="fine_count"
                      stroke="#1565C0"
                      strokeWidth={2}
                      dot={{ fill: '#1565C0' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Violations Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Top Violations
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topViolations}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {topViolations?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Fines */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Fines
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fine ID</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentFines?.map((fine) => (
                      <TableRow key={fine.fine_id}>
                        <TableCell>{fine.fine_id}</TableCell>
                        <TableCell>{fine.vehicle_no}</TableCell>
                        <TableCell align="right">₹{fine.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={fine.status}
                            size="small"
                            color={fine.status === 'paid' ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Repeat Offenders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Repeat Offenders
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle Number</TableCell>
                      <TableCell align="center">Fine Count</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {repeatOffenders?.map((offender, index) => (
                      <TableRow key={index}>
                        <TableCell>{offender.vehicle_no}</TableCell>
                        <TableCell align="center">
                          <Chip label={offender.fine_count} color="error" size="small" />
                        </TableCell>
                        <TableCell align="right">₹{offender.total_amount?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminDashboard;
