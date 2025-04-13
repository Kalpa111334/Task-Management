import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  NotificationsActive as NotificationsIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    chatNotifications: true,
    darkMode: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/users/${user.id}/settings`);
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Don't show error for fetch - use defaults instead
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    setSaved(false);
    setError(null);
  };

  const handleSaveSettings = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(
        `http://localhost:3000/api/users/${user.id}/settings`,
        settings,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        setSaved(true);
        await Swal.fire({
          title: 'Success!',
          text: 'Settings updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to update settings. Please try again.');
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to update settings. Please try again.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Grid>
        )}

        {saved && (
          <Grid item xs={12}>
            <Fade in={saved}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Settings saved successfully!
              </Alert>
            </Fade>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Notifications
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={() => handleSettingChange('emailNotifications')}
                      disabled={loading}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.taskReminders}
                      onChange={() => handleSettingChange('taskReminders')}
                      disabled={loading}
                    />
                  }
                  label="Task Reminders"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.chatNotifications}
                      onChange={() => handleSettingChange('chatNotifications')}
                      disabled={loading}
                    />
                  }
                  label="Chat Notifications"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaletteIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Appearance
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={() => handleSettingChange('darkMode')}
                    disabled={loading}
                  />
                }
                label="Dark Mode"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveSettings}
              disabled={loading || saved}
              sx={{
                width: isMobile ? '100%' : 'auto',
                py: isMobile ? 1.5 : 1,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Save Settings'
              )}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 