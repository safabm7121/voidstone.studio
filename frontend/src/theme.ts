import { createTheme } from '@mui/material/styles';
import { arSA, frFR, enUS } from '@mui/material/locale';

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

export const getTheme = (
  direction: 'ltr' | 'rtl',
  language: string = 'en',
  mode: 'light' | 'dark' = 'light'
) => {
  // Select locale based on language
  let locale;
  switch (language) {
    case 'ar':
      locale = arSA;
      break;
    case 'fr':
      locale = frFR;
      break;
    default:
      locale = enUS;
      break;
  }

  // Color palettes for light/dark mode
  const lightPalette = {
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#666666',
      light: '#999999',
      dark: '#333333',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
  };

  const darkPalette = {
    primary: {
      main: '#ffffff',
      light: '#f5f5f5',
      dark: '#e0e0e0',
      contrastText: '#000000',
    },
    secondary: {
      main: '#bdbdbd',
      light: '#e0e0e0',
      dark: '#9e9e9e',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ffa726',
    },
    info: {
      main: '#29b6f6',
    },
    success: {
      main: '#66bb6a',
    },
  };

  const palette = mode === 'light' ? lightPalette : darkPalette;

  return createTheme(
    {
      direction,
      palette,
      typography: {
        fontFamily:
          direction === 'rtl'
            ? '"Cairo", "Tajawal", "Inter", "Roboto", "Arial", sans-serif'
            : '"Inter", "Roboto", "Arial", sans-serif',
        h1: {
          fontSize: '2.5rem',
          fontWeight: 600,
          lineHeight: direction === 'rtl' ? 1.4 : 1.2,
          '@media (max-width:900px)': {
            fontSize: '2rem',
          },
          '@media (max-width:600px)': {
            fontSize: '1.5rem',
          },
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
          lineHeight: direction === 'rtl' ? 1.4 : 1.2,
          '@media (max-width:900px)': {
            fontSize: '1.5rem',
          },
          '@media (max-width:600px)': {
            fontSize: '1.25rem',
          },
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
          lineHeight: direction === 'rtl' ? 1.4 : 1.2,
          '@media (max-width:900px)': {
            fontSize: '1.25rem',
          },
          '@media (max-width:600px)': {
            fontSize: '1.1rem',
          },
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 500,
          lineHeight: direction === 'rtl' ? 1.5 : 1.3,
          '@media (max-width:900px)': {
            fontSize: '1.25rem',
          },
          '@media (max-width:600px)': {
            fontSize: '1rem',
          },
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 500,
          lineHeight: direction === 'rtl' ? 1.5 : 1.3,
          '@media (max-width:900px)': {
            fontSize: '1rem',
          },
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 500,
          lineHeight: direction === 'rtl' ? 1.6 : 1.4,
        },
        body1: {
          lineHeight: direction === 'rtl' ? 1.8 : 1.6,
        },
        body2: {
          lineHeight: direction === 'rtl' ? 1.7 : 1.5,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: palette.background.default,
              color: palette.text.primary,
              transition: 'background-color 0.3s ease, color 0.3s ease',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: 500,
              letterSpacing: direction === 'rtl' ? 'normal' : '0.5px',
              '@media (max-width:600px)': {
                padding: '8px 16px',
                fontSize: '0.875rem',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              boxShadow:
                mode === 'light'
                  ? '0 2px 8px rgba(0,0,0,0.1)'
                  : '0 2px 8px rgba(255,255,255,0.1)',
              transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            input: {
              textAlign: direction === 'rtl' ? 'right' : 'left',
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              transformOrigin: direction === 'rtl' ? 'right' : 'left',
              left: direction === 'rtl' ? 'auto' : 0,
              right: direction === 'rtl' ? 0 : 'auto',
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-notchedOutline': {
                textAlign: direction === 'rtl' ? 'right' : 'left',
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              textAlign: direction === 'rtl' ? 'right' : 'left',
            },
            alignRight: {
              textAlign: direction === 'rtl' ? 'left' : 'right',
            },
          },
        },
        MuiListItemIcon: {
          styleOverrides: {
            root: {
              minWidth: 40,
              marginRight: direction === 'rtl' ? 0 : 16,
              marginLeft: direction === 'rtl' ? 16 : 0,
            },
          },
        },
        MuiListItemText: {
          styleOverrides: {
            root: {
              textAlign: direction === 'rtl' ? 'right' : 'left',
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            icon: {
              marginRight: direction === 'rtl' ? 0 : 12,
              marginLeft: direction === 'rtl' ? 12 : 0,
            },
          },
        },
        MuiSnackbar: {
          styleOverrides: {
            root: {
              left: direction === 'rtl' ? 24 : 'auto',
              right: direction === 'rtl' ? 'auto' : 24,
              '@media (max-width:600px)': {
                left: direction === 'rtl' ? 16 : 'auto',
                right: direction === 'rtl' ? 'auto' : 16,
              },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            flexContainer: {
              flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
            },
            indicator: {
              left: direction === 'rtl' ? 'auto' : 0,
              right: direction === 'rtl' ? 0 : 'auto',
            },
          },
        },
        MuiPagination: {
          styleOverrides: {
            ul: {
              flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
            },
          },
        },
        MuiBreadcrumbs: {
          styleOverrides: {
            ol: {
              flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
            },
            separator: {
              marginLeft: direction === 'rtl' ? 8 : 0,
              marginRight: direction === 'rtl' ? 0 : 8,
            },
          },
        },
        MuiBadge: {
          styleOverrides: {
            badge: {
              right: direction === 'rtl' ? 'auto' : 0,
              left: direction === 'rtl' ? 0 : 'auto',
              transform: direction === 'rtl'
                ? 'scale(1) translate(-50%, -50%)'
                : 'scale(1) translate(50%, -50%)',
            },
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: {
              flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paperAnchorLeft: {
              left: direction === 'rtl' ? 'auto' : 0,
              right: direction === 'rtl' ? 0 : 'auto',
            },
            paperAnchorRight: {
              left: direction === 'rtl' ? 0 : 'auto',
              right: direction === 'rtl' ? 'auto' : 0,
            },
          },
        },
        // MuiMenu and MuiPopover intentionally omitted to allow proper menu positioning
        MuiSwitch: {
          styleOverrides: {
            switchBase: {
              right: direction === 'rtl' ? 0 : 'auto',
              left: direction === 'rtl' ? 'auto' : 0,
            },
          },
        },
        MuiSlider: {
          styleOverrides: {
            root: {
              direction: direction === 'rtl' ? 'rtl' : 'ltr',
            },
          },
        },
        MuiRating: {
          styleOverrides: {
            root: {
              direction: direction === 'rtl' ? 'rtl' : 'ltr',
            },
          },
        },
      },
    },
    locale
  );
};