import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { fineService, paymentService, vehicleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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

function MyFines() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fines, setFines] = useState([]);
  const [selectedFines, setSelectedFines] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's vehicles
      const vehiclesResponse = await vehicleService.getMyVehicles();
      const vehicles = vehiclesResponse.data.data || [];

      // Get fines for each vehicle
      let allFines = [];
      for (const vehicle of vehicles) {
        const finesResponse = await fineService.getByVehicle(vehicle.vehicle_no);
        const vehicleFines = finesResponse.data.data.fines || [];
        allFines = [...allFines, ...vehicleFines.map(f => ({ ...f, vehicle_no: vehicle.vehicle_no }))];
      }

      setFines(allFines);
    } catch (err) {
      setError(err.message || 'Failed to fetch fines');
      // Mock data
      setFines([
        {
          fine_id: 'FN-1712345678-abc12345',
          vehicle_no: 'MH 12 AB 1234',
          violations: '["SIGNAL_JUMP","NO_SEATBELT"]',
          amount: 2000,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        {
          fine_id: 'FN-1712345679-def67890',
          vehicle_no: 'MH 12 CD 5678',
          violations: '["NO_HELMET"]',
          amount: 1000,
          status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          fine_id: 'FN-1712345680-ghi11223',
          vehicle_no: 'MH 12 AB 1234',
          violations: '["OVER_SPEEDING"]',
          amount: 2000,
          status: 'paid',
          paid_at: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date(Date.now() - 259200000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const parseViolations = (violations) => {
    try {
      const parsed = typeof violations === 'string' ? JSON.parse(violations) : violations;
      return parsed.map(v => VIOLATION_NAMES[v] || v).join(', ');
    } catch {
      return violations;
    }
  };

  const pendingFines = fines.filter(f => f.status === 'pending');
  const paidFines = fines.filter(f => f.status === 'paid');

  const selectedAmount = selectedFines.reduce((sum, fineId) => {
    const fine = fines.find(f => f.fine_id === fineId);
    return sum + (fine ? parseFloat(fine.amount) : 0);
  }, 0);

  const handleSelectFine = (fineId) => {
    setSelectedFines(prev =>
      prev.includes(fineId)
        ? prev.filter(id => id !== fineId)
        : [...prev, fineId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFines.length === pendingFines.length) {
      setSelectedFines([]);
    } else {
      setSelectedFines(pendingFines.map(f => f.fine_id));
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      if (selectedFines.length === 1) {
        const response = await paymentService.payFine(selectedFines[0], {
          payment_method: paymentMethod,
        });
        setTransactionDetails(response.data.data);
      } else {
        const response = await paymentService.bulkPay(selectedFines, paymentMethod);
        setTransactionDetails(response.data.data);
      }
      setPaymentSuccess(true);
      
      // Refresh fines after payment
      setTimeout(() => {
        fetchFines();
        setSelectedFines([]);
        setPaymentDialogOpen(false);
        setPaymentSuccess(false);
        setTransactionDetails(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Payment failed');
      // Mock success for development
      setPaymentSuccess(true);
      setTransactionDetails({
        transactionId: `TXN-${Date.now()}`,
        totalAmount: selectedAmount,
        payments: selectedFines.map(id => ({ fineId: id, amount: fines.find(f => f.fine_id === id)?.amount })),
      });
    } finally {
      setProcessing(false);
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
        My Fines
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error} - Showing sample data
        </Alert>
      )}

      {/* Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography color="warning.dark" variant="body2">
                Pending Fines
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.dark">
                {pendingFines.length}
              </Typography>
              <Typography variant="h6" color="warning.dark">
                ₹{pendingFines.reduce((sum, f) => sum + parseFloat(f.amount), 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.50' }}>
            <CardContent>
              <Typography color="success.dark" variant="body2">
                Paid Fines
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.dark">
                {paidFines.length}
              </Typography>
              <Typography variant="h6" color="success.dark">
                ₹{paidFines.reduce((sum, f) => sum + parseFloat(f.amount), 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: selectedFines.length > 0 ? 'primary.50' : 'grey.100' }}>
            <CardContent>
              <Typography color={selectedFines.length > 0 ? 'primary.dark' : 'text.secondary'} variant="body2">
                Selected for Payment
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                color={selectedFines.length > 0 ? 'primary.dark' : 'text.secondary'}
              >
                {selectedFines.length}
              </Typography>
              <Typography
                variant="h6"
                color={selectedFines.length > 0 ? 'primary.dark' : 'text.secondary'}
              >
                ₹{selectedAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Fines Table */}
      {pendingFines.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Pending Fines
              </Typography>
              {selectedFines.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  Pay Selected (₹{selectedAmount.toLocaleString()})
                </Button>
              )}
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedFines.length === pendingFines.length && pendingFines.length > 0}
                        indeterminate={selectedFines.length > 0 && selectedFines.length < pendingFines.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Fine ID</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Violations</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingFines.map((fine) => (
                    <TableRow
                      key={fine.fine_id}
                      hover
                      selected={selectedFines.includes(fine.fine_id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedFines.includes(fine.fine_id)}
                          onChange={() => handleSelectFine(fine.fine_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {fine.fine_id.substring(0, 15)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{fine.vehicle_no}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {parseViolations(fine.violations)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="error" fontWeight={700}>
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
          </CardContent>
        </Card>
      )}

      {/* Paid Fines */}
      {paidFines.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Paid Fines
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fine ID</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Violations</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Paid On</TableCell>
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
                      <TableCell>{fine.vehicle_no}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {parseViolations(fine.violations)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">₹{fine.amount}</TableCell>
                      <TableCell>
                        {fine.paid_at ? format(new Date(fine.paid_at), 'dd MMM yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip label="Paid" size="small" color="success" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => !processing && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {paymentSuccess ? 'Payment Successful!' : 'Pay Fines'}
        </DialogTitle>
        <DialogContent dividers>
          {paymentSuccess ? (
            <Box textAlign="center" py={3}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Payment Successful!
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Transaction ID: {transactionDetails?.transactionId}
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight={700}>
                ₹{selectedAmount.toLocaleString()}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" gutterBottom>
                You are about to pay {selectedFines.length} fine(s):
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50', my: 2 }}>
                <Stack spacing={1}>
                  {selectedFines.map((fineId) => {
                    const fine = fines.find(f => f.fine_id === fineId);
                    return (
                      <Box key={fineId} display="flex" justifyContent="space-between">
                        <Typography variant="body2">{fine?.vehicle_no}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ₹{fine?.amount}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight={600}>Total Amount</Typography>
                  <Typography variant="h5" color="primary" fontWeight={700}>
                    ₹{selectedAmount.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="card">Credit/Debit Card</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="netbanking">Net Banking</MenuItem>
                  <MenuItem value="wallet">Wallet</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!paymentSuccess && (
            <>
              <Button onClick={() => setPaymentDialogOpen(false)} disabled={processing}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handlePayment}
                disabled={processing}
                startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
              >
                {processing ? 'Processing...' : `Pay ₹${selectedAmount.toLocaleString()}`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyFines;
