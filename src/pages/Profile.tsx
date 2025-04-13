import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Add null check for user object
  const userRole = user?.role || 'Unknown';
  const userName = user?.name || 'Unknown';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await axios.put(`http://localhost:3000/api/users/${user?.id}/password`, {
        currentPassword: password,
        newPassword,
      });

      setPassword('');
      setNewPassword('');
      setConfirmPassword('');

      await Swal.fire({
        title: 'Success!',
        text: 'Password updated successfully',
        icon: 'success',
      });
    } catch (error) {
      setError('Failed to update password. Please check your current password.');
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'secondary.main',
                fontSize: '2rem',
                mr: 2,
              }}
            >
              {user?.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5">{user?.username}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Role: {userRole}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since: {new Date(user?.createdAt || '').toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handlePasswordChange}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
              fullWidth
            >
              Update Password
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Profile; 