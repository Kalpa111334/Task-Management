import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Link,
  Fade,
  Avatar,
  CircularProgress
} from '@mui/material';
import { LockOutlined, AdminPanelSettings, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GradientBackground from '../components/GradientBackground';
import Swal from 'sweetalert2';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter both username and password',
      });
      return;
    }

    setLoading(true);

    try {
      await login(username, password, role);
      navigate(role === 'admin' ? '/admin' : '/employee');
    } catch (error: any) {
      console.error('Login error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || error.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <Fade in timeout={1000}>
        <Container maxWidth="xs">
          <Paper
            elevation={12}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #2196f3, #9c27b0, #f44336)',
              }
            }}
          >
            <Avatar
              sx={{
                mb: 2,
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                transform: 'scale(1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              <LockOutlined />
            </Avatar>

            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Welcome Back
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to continue
            </Typography>

            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(_, newRole) => newRole && setRole(newRole)}
              sx={{ mb: 3, width: '100%' }}
            >
              <ToggleButton 
                value="employee" 
                sx={{ 
                  flex: 1,
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }
                }}
              >
                <Person sx={{ mr: 1 }} /> Employee
              </ToggleButton>
              <ToggleButton 
                value="admin"
                sx={{ 
                  flex: 1,
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }
                }}
              >
                <AdminPanelSettings sx={{ mr: 1 }} /> Admin
              </ToggleButton>
            </ToggleButtonGroup>

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  position: 'relative',
                  background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  href="/register"
                  variant="body2"
                  sx={{
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Don't have an account? Sign Up
                </Link>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Fade>
    </GradientBackground>
  );
};

export default Login; 