import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      light: "#4f83cc",
      main: "#1565c0",
      dark: "#104a7d",
      contrastText: "#fff",
    },
    secondary: {
      light: "#ffb74d",
      main: "#ff9800",
      dark: "#f57c00",
      contrastText: "#000",
    },
    butt1: {
      light: "#ffb74d",
      main: "#ff9800",
      dark: "#f57c00",
      contrastText: "#000",
    },
    background: {
      default: '#f0f0f0',
      paper: '#ffffff'
    },
    customGreen: {
      light: '#e8f5e9',
      main: '#c8e6c9',
      dark: '#a5d6a7',
      contrastText: '#000',
    }
  },
  typography: {
    fontFamily: "Arial, sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          backgroundColor: '#f0f0f0',
          margin: 0,
          padding: 0,
          height: '100%',
          width: '100%',
          overflow: 'auto'
        }
      }
    }
  }
});

export default theme;