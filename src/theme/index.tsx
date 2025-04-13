import { createTheme, responsiveFontSizes, Theme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { AlertProps } from '@mui/material/Alert';
import { ChipProps } from '@mui/material/Chip';
import { AvatarProps } from '@mui/material/Avatar';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: {
      main: string;
      contrastText: string;
    };
    gradients: {
      primary: string;
      secondary: string;
      page: string;
      card: string;
    };
  }
  interface PaletteOptions {
    neutral?: {
      main: string;
      contrastText: string;
    };
    gradients?: {
      primary: string;
      secondary: string;
      page: string;
      card: string;
    };
  }
}

export const getTheme = (mode: PaletteMode) => {
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#2196f3',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#f50057',
        contrastText: '#ffffff'
      },
      neutral: {
        main: '#64748B',
        contrastText: '#ffffff'
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e'
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 500,
        fontSize: '2.5rem'
      },
      h2: {
        fontWeight: 500,
        fontSize: '2rem'
      },
      h3: {
        fontWeight: 500,
        fontSize: '1.75rem'
      },
      h4: {
        fontWeight: 500,
        fontSize: '1.5rem'
      },
      h5: {
        fontWeight: 500,
        fontSize: '1.25rem'
      },
      h6: {
        fontWeight: 500,
        fontSize: '1rem'
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 4px 24px 0 rgba(0,0,0,0.05)' 
              : '0 4px 24px 0 rgba(0,0,0,0.2)'
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: mode === 'light' ? '#f5f5f5' : '#1e1e1e',
            fontWeight: 600
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          standardSuccess: {
            backgroundColor: '#4caf50',
            color: '#fff'
          },
          standardError: {
            backgroundColor: '#f44336',
            color: '#fff'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          colorSuccess: {
            backgroundColor: '#4caf50'
          },
          colorError: {
            backgroundColor: '#f44336'
          }
        }
      }
    }
  });

  return responsiveFontSizes(theme);
}; 