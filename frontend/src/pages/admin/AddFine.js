import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  Check as CheckIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
} from '@mui/icons-material';
import PhotoUploadComponent from '../../components/common/PhotoUploadComponent';
import api from '../../services/api';

const VIOLATIONS = [
  { code: 'SIGNAL_JUMP', name: 'Signal Jump', amount: 1000 },
  { code: 'NO_HELMET', name: 'No Helmet', amount: 1000 },
  { code: 'NO_SEATBELT', name: 'No Seatbelt', amount: 1500 },
  { code: 'USING_MOBILE', name: 'Using Mobile While Driving', amount: 2000 },
  { code: 'TRIPLE_RIDING', name: 'Triple Riding', amount: 1000 },
  { code: 'RASH_DRIVING', name: 'Rash Driving', amount: 5000 },
  { code: 'OVER_SPEEDING', name: 'Over Speeding', amount: 2000 },
  { code: 'WRONG_SIDE', name: 'Wrong Side Driving', amount: 1500 },
  { code: 'NO_LICENSE', name: 'No License/Invalid License', amount: 5000 },
  { code: 'NO_INSURANCE', name: 'No Insurance', amount: 2000 },
  { code: 'NO_PUC', name: 'Expired/No PUC Certificate', amount: 1000 },
  { code: 'EXPIRED_REG', name: 'Expired Vehicle Registration', amount: 3000 },
  { code: 'DRUNK_DRIVING', name: 'Drunk Driving', amount: 10000 },
  { code: 'HIT_AND_RUN', name: 'Hit and Run', amount: 10000 },
  { code: 'ACCIDENT', name: 'Accident Involved', amount: 5000 },
];

const VEHICLE_TYPES = ['Car', 'Bike', 'Motorcycle', 'Truck', 'Bus', 'Auto-Rickshaw', 'Other'];

const steps = ['Upload Photo & Vehicle Details', 'Select Violations', 'Review & Submit'];

function AddFine() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Step 1: Image and Vehicle Details
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [uploadedPhoto, setUploadedPhoto] = useState(null);

  // Step 2: Violations
  const [selectedViolations, setSelectedViolations] = useState({});

  // Step 3: Additional Details
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate total amount
  const calculateTotalAmount = () => {
    return Object.keys(selectedViolations)
      .filter(key => selectedViolations[key])
      .reduce((sum, key) => {
        const violation = VIOLATIONS.find(v => v.code === key);
        return sum + (violation ? violation.amount : 0);
      }, 0);
  };

  // Get selected violation details
  const getSelectedViolationDetails = () => {
    return Object.keys(selectedViolations)
      .filter(key => selectedViolations[key])
      .map(code => VIOLATIONS.find(v => v.code === code));
  };

  const handlePhotoUpload = (photoData) => {
    setUploadedPhoto(photoData);
  };

  const handleViolationChange = (code) => {
    setSelectedViolations(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate step 1
      if (!vehicleNo.trim()) {
        setError('Please enter vehicle number');
        return;
      }
      if (!vehicleType) {
        setError('Please select vehicle type');
        return;
      }
    } else if (activeStep === 1) {
      // Validate step 2
      const hasViolations = Object.values(selectedViolations).some(v => v);
      if (!hasViolations) {
        setError('Please select at least one violation');
        return;
      }
    }

    setError(null);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const violations = Object.keys(selectedViolations)
        .filter(key => selectedViolations[key]);

      const fineData = {
        vehicle_no: vehicleNo.toUpperCase(),
        vehicle_type: vehicleType,
        violations: violations,
        image_path: uploadedPhoto?.path || null,
        location: location || null,
        notes: notes || null
      };

      const response = await api.post('/api/fines', fineData);

      setSuccess(`Fine created successfully! Fine ID: ${response.data.data.fine_id}`);
      
      // Reset form
      setTimeout(() => {
        setActiveStep(0);
        setVehicleNo('');
        setVehicleType('Car');
        setSelectedViolations({});
        setLocation('');
        setNotes('');
        setUploadedPhoto(null);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create fine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        ➕ Add New Traffic Fine
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error/Success Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Step 1: Photo Upload & Vehicle Details */}
      {activeStep === 0 && (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📸 Upload Vehicle Photo
              </Typography>
              <PhotoUploadComponent
                label="Upload vehicle photo with number plate"
                onUploadSuccess={handlePhotoUpload}
              />
              {uploadedPhoto && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✓ Photo uploaded: {uploadedPhoto.originalName}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚗 Vehicle Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Vehicle Number"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    placeholder="MH 01 AB 1234"
                    fullWidth
                    variant="outlined"
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Format: MH 01 AB 1234 (can be with or without spaces)
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      label="Vehicle Type"
                    >
                      {VEHICLE_TYPES.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              endIcon={<NextIcon />}
              onClick={handleNext}
            >
              Next: Select Violations
            </Button>
          </Box>
        </Stack>
      )}

      {/* Step 2: Select Violations */}
      {activeStep === 1 && (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚠️ Select Violations
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Select all violations applicable for this fine. Amounts will be auto-calculated.
              </Typography>

              <FormGroup>
                <Grid container spacing={2}>
                  {VIOLATIONS.map(violation => (
                    <Grid item xs={12} sm={6} key={violation.code}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedViolations[violation.code] || false}
                            onChange={() => handleViolationChange(violation.code)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {violation.name}
                            </Typography>
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                              ₹{violation.amount}
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>

              {Object.values(selectedViolations).some(v => v) && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total Fine Amount: ₹{calculateTotalAmount()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              endIcon={<NextIcon />}
              onClick={handleNext}
            >
              Next: Review
            </Button>
          </Box>
        </Stack>
      )}

      {/* Step 3: Review & Submit */}
      {activeStep === 2 && (
        <Stack spacing={3}>
          {/* Vehicle Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📋 Fine Summary</Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Vehicle Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {vehicleNo}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Vehicle Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {vehicleType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Photo</Typography>
                  <Chip
                    icon={uploadedPhoto ? <CheckIcon /> : undefined}
                    label={uploadedPhoto ? 'Attached' : 'No Photo'}
                    color={uploadedPhoto ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total Fine</Typography>
                  <Typography variant="h6" color="error" sx={{ fontWeight: 'bold' }}>
                    ₹{calculateTotalAmount()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Violations Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📌 Violations</Typography>
              <Stack spacing={1}>
                {getSelectedViolationDetails().map(v => (
                  <Paper key={v.code} sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{v.name}</Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                        ₹{v.amount}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Optional Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📝 Additional Details (Optional)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Location of Violation"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Near Crossroads, Highway 5"
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes/Remarks"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes about the violation"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleSubmit}
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Create Fine'}
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  );
}

export default AddFine;
