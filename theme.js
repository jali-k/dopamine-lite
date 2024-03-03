import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      light: "#4f83cc", // lighter shade of primary color
      main: "#1565c0", // slightly darker primary color
      dark: "#104a7d", // even darker shade of primary color
      contrastText: "#fff", // text color for primary background
    },
    secondary: {
      light: "#ffb74d", // lighter shade of secondary color
      main: "#ff9800", // secondary color
      dark: "#f57c00", // darker shade of secondary color
      contrastText: "#000", // text color for secondary background
    },
    butt1: {
      light: "#ffb74d", // lighter shade of secondary color
      main: "#ff9800", // secondary color
      dark: "#f57c00", // darker shade of secondary color
      contrastText: "#000", // text color for secondary background
    },
  },
  typography: {
    fontFamily: "Arial, sans-serif",
  },
});

export default theme;
