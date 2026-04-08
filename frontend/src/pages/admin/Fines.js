import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { fineService } from '../../services/api';
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

function AdminFines() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFine, setSelectedFine] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { vehicleNo: searchQuery }),
      };
      const response = await fineService.getAll(params);
      setFines(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch fines');
      // Mock data for development
      setFines([
        {
          fine_id: 'FN-1712345678-abc12345',
          vehicle_no: 'MH 12 AB 1234',
          vehicle_type: 'Car',
          violations: '["SIGNAL_JUMP","NO_SEATBELT"]',
          amount: 2000,
          status: 'pending',
          location: 'Mumbai Central',
          officer_name: 'Officer Kumar',
          created_at: new Date().toISOString(),
        },
        {
          fine_id: 'FN-1712345679-def67890',
          vehicle_no: 'MH 14 CD 5678',
          vehicle_type: 'Bike',
          violations: '["NO_HELMET","TRIPLE_RIDING"]',
          amount: 2000,
          status: 'paid',
          location: 'Andheri',
          officer_name: 'Officer Singh',
          created_at: new Date().toISOString(),
        },
        {
          fine_id: 'FN-1712345680-ghi11223',
          vehicle_no: 'MH 01 EF 9012',
          vehicle_type: 'Truck',
          violations: '["OVER_SPEEDING","RASH_DRIVING"]',
          amount: 7000,
          status: 'pending',
          location: 'Thane',
          officer_name: 'Officer Patel',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchFines();
  };

  const handleViewDetails = (fine) => {
    setSelectedFine(fine);
    setDetailDialogOpen(true);
  };

  const parseViolations = (violations) => {
    try {
      const parsed = typeof violations === 'string' ? JSON.parse(violations) : violations;
      return parsed.map((v) => VIOLATION_NAMES[v] || v).join(', ');
    } catch {
      return violations;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'disputed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Fine Management
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error} - Showing sample data
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by vehicle number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="disputed">Disputed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button type="submit" variant="contained" startIcon={<FilterIcon />}>
                  Apply Filters
                </Button>
                <IconButton onClick={fetchFines} sx={{ ml: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Fines Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fine ID</TableCell>
                <TableCell>Vehicle No</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Violations</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : fines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No fines found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                fines.map((fine) => (
                  <TableRow key={fine.fine_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {fine.fine_id.substring(0, 15)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {fine.vehicle_no}
                      </Typography>
                    </TableCell>
                    <TableCell>{fine.vehicle_type}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
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
                        color={getStatusColor(fine.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(fine.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(fine)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={-1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Fine Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Fine Details</DialogTitle>
        <DialogContent dividers>
          {selectedFine && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Fine ID
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {selectedFine.fine_id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Vehicle Number
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {selectedFine.vehicle_no}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Vehicle Type
                </Typography>
                <Typography variant="body2">{selectedFine.vehicle_type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box>
                  <Chip
                    label={selectedFine.status}
                    size="small"
                    color={getStatusColor(selectedFine.status)}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Violations
                </Typography>
                <Typography variant="body2">
                  {parseViolations(selectedFine.violations)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h5" color="error" fontWeight={700}>
                  ₹{selectedFine.amount}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body2">{selectedFine.location || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Officer
                </Typography>
                <Typography variant="body2">{selectedFine.officer_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body2">
                  {format(new Date(selectedFine.created_at), 'dd MMM yyyy, HH:mm')}
                </Typography>
              </Grid>
              {selectedFine.image_url && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Evidence Image
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <img
                      src={selectedFine.image_url}
                      alt="Evidence"
                      style={{ maxWidth: '100%', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminFines;
