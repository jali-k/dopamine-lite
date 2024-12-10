import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      // Chlorophyll green
      light: "#4caf50",
      main: "#2e7d32",
      dark: "#1b5e20",
      contrastText: "#fff",
    },
    secondary: {
      // Cell membrane purple
      light: "#9575cd",
      main: "#673ab7",
      dark: "#4527a0",
      contrastText: "#fff",
    },
    success: {
      // Healthy tissue green
      light: "#81c784",
      main: "#43a047",
      dark: "#2e7031",
      contrastText: "#fff",
    },
    error: {
      // Cell danger red
      light: "#ef5350",
      main: "#d32f2f",
      dark: "#c62828",
      contrastText: "#fff",
    },
    background: {
      default: "#f5f8f5", // Subtle chloroplast inspired
      paper: "#ffffff",
    },
    customColors: {
      membrane: "#b39ddb", // Light purple for membranes
      cytoplasm: "#e8f5e9", // Very light green
      nucleus: "#5c6bc0", // DNA blue
      mitochondria: "#fff176", // Energy yellow
      cellWall: "#a5d6a7", // Plant cell wall green
    }
  },
  typography: {
    fontFamily: "'Quicksand', Arial, sans-serif",
    h4: {
      fontWeight: 600,
      color: "#2e7d32", // Match primary main
    },
    h5: {
      fontWeight: 500,
      color: "#2e7d32",
    },
    h6: {
      fontWeight: 500,
      color: "#2e7d32",
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          backgroundColor: '#f5f8f5',
          margin: 0,
          padding: 0,
          height: '100%',
          width: '100%',
          overflow: 'auto'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
          }
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '16px 0',
            boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)',
          }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(46, 125, 50, 0.2)',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    }
  }
});

export default theme;