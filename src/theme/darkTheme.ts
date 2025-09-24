import { createTheme } from "@mui/material";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "hsl(210, 99%, 50%)", // --color-button-info
    },
    secondary: {
      main: "hsl(155, 61%, 44%)", // --color-tertiary
    },
    background: {
      paper: "hsl(216, 6%, 15%)", // --color-secondary-bg
      default: "hsl(240, 8%, 9%)", // --color-primary-bg
    },
    text: {
      primary: "hsl(60, 100%, 100%)", // --color-primary-text
      secondary: "hsl(214, 16%, 64%)", // --color-secondary-text
    },
    error: {
      main: "hsl(0, 81%, 62%)", // --color-button-danger
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: "hsl(60, 100%, 100%)", // --color-primary-text
          "& fieldset": {
            borderColor: "hsl(0, 0%, 0%)", // --color-stroke
          },
          "&:hover fieldset": {
            borderColor: "hsl(210, 99%, 50%)", // --color-button-info
          },
          "&.Mui-focused fieldset": {
            borderColor: "hsl(210, 99%, 50%)", // --color-button-info
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "hsl(60, 100%, 100%)", // --color-primary-text
          "&.Mui-focused": {
            color: "hsl(210, 99%, 50%)", // --color-button-info
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: "hsl(60, 100%, 100%)", // --color-primary-text
        },
        input: {
          color: "hsl(60, 100%, 100%)", // --color-primary-text
          "&::placeholder": {
            color: "hsl(60, 100%, 100%)", // --color-primary-text
            opacity: 1,
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: "hsl(60, 100%, 100%)", // --color-primary-text
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "var(--color-primary-bg)",
          color: "var(--color-primary-text)",
          fontSize: "0.875rem",
          border: "1px solid var(--color-stroke)",
        },
        arrow: {
          color: "var(--color-primary-bg)",
          "&::before": {
            border: "1px solid var(--color-stroke)",
          },
        },
      },
    },
  },
});
