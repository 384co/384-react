import { Theme, createTheme } from "@mui/material";
import { base } from "./base";

const dark: Theme = createTheme({
  breakpoints:{
    ...base.breakpoints
  },
  palette: {
    ...base.palette,
    mode: "dark",
    // background: {
    //   default: "#121212",
    // },
    text: {
      primary: "#ffffff",
      secondary: "rgb(255,255,255, 0.5)",
      disabled: "rgb(255,255,255, 0.5)",
      // icon: "rgb(255,255,255, 0.12)",
    },
  },
  typography: {
    ...base.typography
  },
  components: {
    ...base.components
  }

});

export default dark;
