import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { paymentService } from '../../services/api';
import { format } from 'date-fns';

function PaymentHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getHistory();
      setPayments(response.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch payment history');
      // Mock data
      setPayments([
        {
          payment_id: 'PAY-1712345678-abc12345',
          fine_id: 'FN-1712345678-abc12345',
          vehicle_no: 'MH 12 AB 1234',
          amount: 2000,
          payment_method: 'card',
          transaction_id: 'TXN-1712345678',
          status: 'completed',
          created_at: new Date().toISOString(),
          violations: '["SIGNAL_JUMP","NO_SEATBELT"]',
        },
        {
          payment_id: 'PAY-1712345679-def67890',
          fine_id: 'FN-1712345679-def67890',
          vehicle_no: 'MH 12 CD 5678',
          amount: 1000,
          payment_method: 'upi',
          transaction_id: 'TXN-1712345679',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          violations: '["NO_HELMET"]',
        },
        {
          payment_id: 'PAY-1712345680-ghi11223',
          fine_id: 'FN-1712345680-ghi11223',
          vehicle_no: 'MH 12 AB 1234',
          amount: 5000,
          payment_method: 'netbanking',
          transaction_id: 'TXN-1712345680',
          status: 'completed',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          violations: '["RASH_DRIVING"]',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const getPaymentMethodLabel = (method) => {
    const labels = {
      card: 'Credit/Debit Card',
      upi: 'UPI',
      netbanking: 'Net Banking',
      wallet: 'Wallet',
    };
    return labels[method] || method;
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
        Payment History
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error} - Showing sample data
        </Alert>
      )}

      {/* Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.50' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PaymentIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography color="success.dark">Total Payments</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="success.dark">
                {payments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'primary.50' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ReceiptIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography color="primary.dark">Total Amount Paid</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="primary.dark">
                ₹{totalPaid.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Table */}
      <Card>
        <CardContent>
          {payments.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
              <ReceiptIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Payments Yet
              </Typography>
              <Typography color="text.secondary">
                Your payment history will appear here once you pay fines
              </Typography>
            </Paper>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Fine ID</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.payment_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {payment.transaction_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {payment.fine_id?.substring(0, 15)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{payment.vehicle_no}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          ₹{payment.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getPaymentMethodLabel(payment.payment_method)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.created_at), 'dd MMM yyyy, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={payment.status}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default PaymentHistory;
