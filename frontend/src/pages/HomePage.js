import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  LocalPolice as PoliceIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: <CarIcon sx={{ fontSize: 40 }} />,
    title: 'ANPR Technology',
    description: 'Automatic Number Plate Recognition for quick vehicle identification',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Secure System',
    description: 'Azure AD B2C authentication ensures your data is protected',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: 'Quick Processing',
    description: 'Instant fine generation with OCR-based number plate extraction',
  },
  {
    icon: <PaymentIcon sx={{ fontSize: 40 }} />,
    title: 'Easy Payments',
    description: 'Pay your fines online securely without visiting offices',
  },
];

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, login } = useAuth();

  const handleAdminLogin = () => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin');
    } else {
      login('admin');
    }
  };

  const handleUserLogin = () => {
    if (isAuthenticated) {
      navigate('/user');
    } else {
      login('user');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <PoliceIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart Traffic Fine Management
          </Typography>
          {isAuthenticated && (
            <Button
              color="inherit"
              onClick={() => navigate(isAdmin ? '/admin' : '/user')}
            >
              Go to Dashboard
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
            Traffic Fine Management System
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            ANPR-Based Smart Solution for Traffic Violation Management
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<PoliceIcon />}
              onClick={handleAdminLogin}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
                px: 4,
                py: 1.5,
              }}
            >
              Admin Portal
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PersonIcon />}
              onClick={handleUserLogin}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                px: 4,
                py: 1.5,
              }}
            >
              Citizen Portal
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" textAlign="center" gutterBottom fontWeight={600}>
          Key Features
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          A comprehensive solution for modern traffic fine management
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" textAlign="center" gutterBottom fontWeight={600}>
            How It Works
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" color="primary" gutterBottom fontWeight={600}>
                    For Traffic Police
                  </Typography>
                  <Stack spacing={2}>
                    <Typography>1. Capture vehicle image or enter number</Typography>
                    <Typography>2. OCR extracts number plate automatically</Typography>
                    <Typography>3. Select violations and generate fine</Typography>
                    <Typography>4. Fine is stored with proof image</Typography>
                    <Typography>5. Track payments and repeat offenders</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" color="secondary" gutterBottom fontWeight={600}>
                    For Citizens
                  </Typography>
                  <Stack spacing={2}>
                    <Typography>1. Login with your account</Typography>
                    <Typography>2. Check fines by vehicle number or image</Typography>
                    <Typography>3. View pending fines and details</Typography>
                    <Typography>4. Pay fines online securely</Typography>
                    <Typography>5. Download receipts and track history</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.dark', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography textAlign="center" variant="body2">
            © 2024 Smart Traffic Fine Management System. Built with Azure Cloud Services.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default HomePage;
