import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper
} from '@mui/material';

const ConfirmSignup = () => {
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { confirmSignUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get username from location state if available
    if (location.state && location.state.username) {
      setUsername(location.state.username);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !code) {
      setError('Username and verification code are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await confirmSignUp(username, code);
      // Redirect to login page after successful confirmation
      navigate('/login', { state: { confirmationSuccess: true } });
    } catch (err) {
      setError(err.message || 'Failed to confirm signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 8 }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Confirm Your Account
          </Typography>
          <Typography variant="body2" align="center" gutterBottom sx={{ mb: 3 }}>
            We've sent a verification code to your email. Please enter it below.
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!!location.state?.username}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="code"
              label="Verification Code"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                Back to Login
              </Link>
              {/* TODO: Add resend code functionality */}
              <Button variant="text" size="small" disabled>
                Resend Code
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ConfirmSignup;
