import React from 'react';
import { Box } from '@mui/material';

const GradientBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: `
          linear-gradient(
            45deg,
            rgba(66, 165, 245, 0.7),
            rgba(156, 39, 176, 0.7),
            rgba(233, 30, 99, 0.7),
            rgba(255, 193, 7, 0.7)
          )
        `,
        backgroundSize: '400% 400%',
        animation: 'gradient 15s ease infinite',
        '@keyframes gradient': {
          '0%': {
            backgroundPosition: '0% 50%'
          },
          '50%': {
            backgroundPosition: '100% 50%'
          },
          '100%': {
            backgroundPosition: '0% 50%'
          }
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {children}
    </Box>
  );
};

export default GradientBackground; 