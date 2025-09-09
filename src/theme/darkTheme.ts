import { createTheme } from "@mui/material";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5865F2",
    },
    background: {
      paper: "#212A31",
      default: "#212A31",
    },
    text: {
      primary: "#D3D9D4",
      secondary: "#FFFFFF",
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: "#D3D9D4",
          "& fieldset": {
            borderColor: "#2E3944",
          },
          "&:hover fieldset": {
            borderColor: "#5865F2",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#5865F2",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#FFFFFF",
          "&.Mui-focused": {
            color: "#5865F2",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: "#D3D9D4",
        },
        input: {
          color: "#D3D9D4",
          "&::placeholder": {
            color: "#FFFFFF",
            opacity: 1,
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: "#FFFFFF",
        },
      },
    },
  },
});
