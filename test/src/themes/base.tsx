interface CustomMuiBase {
  ownerState: {
    variant?: "contained" | "text" | "outlined";
    color?: "primary" | "secondary" | "gray";
    unit?: string;
  };
}

export interface MuiButtonStatProps extends CustomMuiBase {}
export const base: any = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      "sans-serif",
    ].join(","),
    h1: {
      fontFamily: "countach",
    },
    h2: {
      fontFamily: "countach",
    },
    h3: {
      fontFamily: "countach",
    },
    h4: {
      fontFamily: "countach",
    },
    h5: {
      fontFamily: "countach",
    },
    h6: {
      fontFamily: "countach",
    },
    body1: {},
    body2: {},
  },
  palette: {
    primary: {
      main: "#FF5C42",
      contrastText: "#FFF",
    },
  },

  components: {
    // MuiInputBase: {
    //   styleOverrides: {
    //     root: {
    //       "&.Mui-focused": {
    //         borderColor: "#ff5c42 !important",
    //       },
    //     },
    //   },
    // },
    // MuiOutlinedInput: {
    //   styleOverrides: {
    //     root: {
    //       "&.Mui-focused": {
    //         borderColor: "#ff5c42 !important",
    //       },
    //     },
    //   },
    // },
    // MuiPaper: {
    //   styleOverrides: {
    //     root: {
    //       padding: "16px",
    //     },
    //   },
    // },
    // MuiButton: {
    //   styleOverrides: {
    //     // Name of the slot
    //     root: ({ ownerState }: MuiButtonStatProps) => ({
    //       ...(ownerState.variant === "contained" &&
    //         ownerState.color === "primary" && {
    //           backgroundColor: "#FF5C42",
    //           color: "#2D2D2D",
    //           "&:hover": {
    //             color: "#2D2D2D",
    //             backgroundColor: "#DB362F",
    //           },
    //         }),
    //       ...(ownerState.variant === "text" &&
    //         ownerState.color === "primary" && {
    //           color: "#FF5C42",
    //           "&:hover": {
    //             color: "#FF5C42",
    //             backgroundColor: "rgba(255, 92, 66, 0.1)",
    //           },
    //         }),
    //       ...(ownerState.variant === "outlined" &&
    //         ownerState.color === "primary" && {
    //           color: "#FF5C42",
    //           borderColor: "#FF5C42",
    //           "&:hover": {
    //             color: "#FF5C42",
    //             borderColor: "#FF5C42",
    //             backgroundColor: "rgba(255, 92, 66, 0.1)",
    //           },
    //         }),
    //     }),
    //   },
    },
};
