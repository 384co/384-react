
import { Theme, createTheme } from "@mui/material"
import { base } from "./base"


const light: Theme = createTheme({
    breakpoints:{
        ...base.breakpoints
      },
      palette: {
        ...base.palette,
        mode: "light",
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
})

export default light
