import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import {
  LocalPolice as PoliceIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Check if already authenticated
  const token = localStorage.getItem('accessToken');
  if (token) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      // Store token and user data
      localStorage.setItem('accessToken', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      // Redirect based on role
      if (response.data.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setShowLoginForm(true);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Container maxWidth="md">
        {!showLoginForm ? (
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                🚔 Traffic Fine Management
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Select your role to login or create a new account
              </Typography>
            </Box>

            {/* Role Selection Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
                mb: 3
              }}
            >
              {/* Police Officer Card */}
              <Card elevation={3} sx={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                <CardContent sx={{ textAlign: 'center', padding: 3 }}>
                  <PoliceIcon sx={{ fontSize: 50, color: '#1565c0', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Police Officer
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Add fines, manage violations, and track payments
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleQuickLogin('admin@trafficfine.com', 'admin123')}
                    >
                      Admin Login
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/signup')}
                    >
                      Create Admin Account
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Citizen Card */}
              <Card elevation={3} sx={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                <CardContent sx={{ textAlign: 'center', padding: 3 }}>
                  <PersonIcon sx={{ fontSize: 50, color: '#2e7d32', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Citizen
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Check your fines and make online payments
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleQuickLogin('user@example.com', 'user123')}
                    >
                      User Login
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={() => navigate('/signup')}
                    >
                      Create Account
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Divider sx={{ my: 2, color: 'rgba(255,255,255,0.3)' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>OR</Typography>
            </Divider>

            {/* Custom Login Button */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: 'white'
                  }
                }}
                onClick={() => setShowLoginForm(true)}
              >
                Login with Email & Password
              </Button>
            </Box>

            {/* Sample Credentials */}
            <Card sx={{ backgroundColor: 'rgba(255,255,255,0.95)', mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  📝 Sample Credentials for Testing:
                </Typography>
                <Stack spacing={1} sx={{ fontSize: '0.9rem', mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Admin:</strong> admin@trafficfine.com / admin123
                  </Typography>
                  <Typography variant="body2">
                    <strong>User:</strong> user@example.com / user123
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          /* Login Form */
          <Card elevation={3} sx={{ maxWidth: 400, mx: 'auto' }}>
            <CardContent sx={{ padding: 4 }}>
              <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Login
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleLogin}>
                <Stack spacing={2}>
                  <TextField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    disabled={loading}
                    autoFocus
                  />

                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    disabled={loading}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Login'}
                  </Button>

                  <Button
                    variant="text"
                    onClick={() => {
                      setShowLoginForm(false);
                      setEmail('');
                      setPassword('');
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    Back
                  </Button>

                  <Divider />

                  <Typography variant="body2" sx={{ textAlign: 'center' }}>
                    Don't have an account?{' '}
                    <MuiLink
                      component="button"
                      type="button"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/signup');
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      Sign up here
                    </MuiLink>
                  </Typography>
                </Stack>
              </form>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default LoginPage;
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: 2 }}>
          <CardContent>
            <Box textAlign="center" mb={4}>
              <PoliceIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Traffic Fine System
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select your portal to continue
              </Typography>
            </Box>

            {(error || loginError) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || loginError}
              </Alert>
            )}

            <Stack spacing={3}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PoliceIcon />}
                onClick={() => handleLogin('admin')}
                disabled={isLoggingIn}
                sx={{ py: 2 }}
              >
                {isLoggingIn ? <CircularProgress size={24} color="inherit" /> : 'Admin / Police Login'}
              </Button>

              <Divider>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<PersonIcon />}
                onClick={() => handleLogin('user')}
                disabled={isLoggingIn}
                sx={{ py: 2 }}
              >
                {isLoggingIn ? <CircularProgress size={24} color="inherit" /> : 'Citizen Login'}
              </Button>
            </Stack>

            <Box mt={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                By logging in, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Box>

            {process.env.REACT_APP_ENVIRONMENT === 'development' && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Development Mode:</strong> Authentication is simulated.
                  Click any button to login with a test account.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Box mt={3} textAlign="center">
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ color: 'white' }}
          >
            ← Back to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;
