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
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  PersonAdd,
  AdminPanelSettings,
  Person,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GradientBackground from '../components/GradientBackground';
import Swal from 'sweetalert2';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'employee' as 'admin' | 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match. Please try again.',
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/auth/register', {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role
      });

      await Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'You can now login with your credentials',
      });

      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.response?.data?.message || 'An error occurred during registration',
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
                bgcolor: 'secondary.main',
                transform: 'scale(1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              <PersonAdd />
            </Avatar>

            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
              Create Account
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join us to start managing tasks
            </Typography>

            <ToggleButtonGroup
              value={formData.role}
              exclusive
              onChange={(_, newRole) => newRole && setFormData({ ...formData, role: newRole })}
              sx={{ mb: 3, width: '100%' }}
            >
              <ToggleButton 
                value="employee"
                sx={{ 
                  flex: 1,
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'secondary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
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
                    backgroundColor: 'secondary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
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
                label="Full Name"
                variant="outlined"
                margin="normal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'secondary.main',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'secondary.main',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'secondary.main',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'secondary.main',
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
                  background: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #7b1fa2 30%, #6a1b9a 90%)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Sign Up'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  href="/login"
                  variant="body2"
                  sx={{
                    textDecoration: 'none',
                    color: 'secondary.main',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Already have an account? Sign In
                </Link>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Fade>
    </GradientBackground>
  );
};

export default Register; 