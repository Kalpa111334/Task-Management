import { Theme, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
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

const getTheme = (mode: PaletteMode) => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
      secondary: {
        main: '#f50057',
        light: '#ff4081',
        dark: '#c51162',
      },
      neutral: {
        main: mode === 'light' ? '#f5f5f5' : '#424242',
        light: mode === 'light' ? '#fafafa' : '#616161',
        dark: mode === 'light' ? '#eeeeee' : '#212121',
      },
      gradients: {
        primary: mode === 'light' 
          ? 'linear-gradient(120deg, #2196f3 0%, #64b5f6 100%)'
          : 'linear-gradient(120deg, #1976d2 0%, #2196f3 100%)',
        secondary: mode === 'light'
          ? 'linear-gradient(120deg, #f50057 0%, #ff4081 100%)'
          : 'linear-gradient(120deg, #c51162 0%, #f50057 100%)',
        page: mode === 'light'
          ? 'linear-gradient(135deg, #f6f8fc 0%, #e9f2ff 100%)'
          : 'linear-gradient(135deg, #121212 0%, #1e1e2d 100%)',
        card: mode === 'light'
          ? 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)'
          : 'linear-gradient(135deg, #1e1e2d 0%, #2d2d3f 100%)',
      },
      background: {
        default: mode === 'light' ? '#f6f8fc' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e2d',
      },
      error: {
        main: '#f44336',
        light: '#e57373',
        dark: '#d32f2f',
      },
      warning: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00',
      },
      info: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
      success: {
        main: '#4caf50',
        light: '#81c784',
        dark: '#388e3c',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
          },
          contained: {
            background: theme => theme.palette.gradients.primary,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
              background: theme => theme.palette.gradients.primary,
              filter: 'brightness(110%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            background: theme => theme.palette.gradients.card,
            backdropFilter: 'blur(10px)',
            boxShadow: mode === 'light' 
              ? '0 4px 24px 0 rgba(0,0,0,0.05)' 
              : '0 4px 24px 0 rgba(0,0,0,0.2)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            '&.MuiDialog-paper': {
              background: theme => theme.palette.gradients.card,
              backdropFilter: 'blur(10px)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${mode === 'light' ? '#f0f0f0' : '#424242'}`,
          },
          head: {
            background: theme => theme.palette.gradients.card,
            fontWeight: 600,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
          standardError: {
            backgroundColor: (theme: Theme) => theme.palette.error.main,
            color: '#fff'
          },
          standardWarning: {
            backgroundColor: (theme: Theme) => theme.palette.warning.main,
            color: '#fff'
          }
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
          colorPrimary: {
            backgroundColor: (theme: Theme) => theme.palette.primary.main
          },
          colorSecondary: {
            backgroundColor: (theme: Theme) => theme.palette.secondary.main
          }
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: (theme: Theme) => theme.palette.primary.main
          }
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
  });

  theme = responsiveFontSizes(theme);

  return theme;
};

export default getTheme; 