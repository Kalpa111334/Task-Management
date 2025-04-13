import React from 'react';
import { Box, Typography, CircularProgress, useTheme, keyframes } from '@mui/material';
import { Assignment as TaskIcon } from '@mui/icons-material';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gradientMove = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const SplashScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(-45deg, #2196f3, #64b5f6, #1976d2, #42a5f5)'
          : 'linear-gradient(-45deg, #1a237e, #283593, #1565c0, #0d47a1)',
        backgroundSize: '400% 400%',
        animation: `${gradientMove} 15s ease infinite`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        },
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          animation: `${fadeIn} 0.5s ease-out`,
          padding: 4,
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${pulse} 2s infinite ease-in-out`,
            boxShadow: '0 0 30px rgba(33, 150, 243, 0.3)',
            border: '4px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <TaskIcon sx={{ fontSize: 50, color: 'white' }} />
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            letterSpacing: 1,
            mb: 1,
          }}
        >
          Task Management
        </Typography>

        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              color: 'white',
              opacity: 0.9,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 500,
                animation: `${fadeIn} 1s infinite alternate`,
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              Loading
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            fontWeight: 500,
            animation: `${fadeIn} 0.5s ease-out`,
            animationDelay: '0.3s',
            animationFillMode: 'backwards',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          Preparing your workspace...
        </Typography>
      </Box>
    </Box>
  );
};

export default SplashScreen; 