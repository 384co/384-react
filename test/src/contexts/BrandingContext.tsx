import React, { useState, useEffect, useRef } from "react";
import { createTheme, Theme, ThemeOptions } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { light, dark } from "../themes";
import { PaletteColorOptions } from "@mui/material/styles/createPalette";
import IndexedKV from "../utils/IndexedKV";
const kv = new IndexedKV({ db: "branding", table: "local" });
export interface BrandingContextType {
  primaryColor: PaletteColorOptions | null;
  setPrimaryColor: React.Dispatch<React.SetStateAction<PaletteColorOptions | null>>;
  logoLight: string | null;
  logoDark: string | null;
  secondaryColor: PaletteColorOptions | null;
  setSecondaryColor: React.Dispatch<
    React.SetStateAction<PaletteColorOptions | null>
  >;
  mode: string;
  setMode: React.Dispatch<React.SetStateAction<string>>;
  theme: ThemeOptions;
  reset: () => void;
  updateLogo: (logo: string, type: string) => void;
  updateMode: (mode: "light" | "dark" | "system") => void;
  apply: () => void;
}

const BrandingContext = React.createContext<BrandingContextType>({
  primaryColor: null,
  setPrimaryColor: () => {},
  secondaryColor: null,
  setSecondaryColor: () => {},
  mode: 'dark',
  setMode: () => {},
  theme: {},
  reset: () => {},
  updateLogo: () => {},
  updateMode: () => {},
  apply: () => {},
  logoLight: null,
  logoDark: null,
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const defaultPrimaryColor = { main: "#FF5C42" };
  const defaultSecondaryColor = { main: "#0F0F0F" };
  let loading = useRef(true);
  const [primaryColor, setPrimaryColor] = useState(
    null as PaletteColorOptions | null
  );
  const [secondaryColor, setSecondaryColor] = useState( null as PaletteColorOptions | null);
  const [mode, setMode] = useState<string>('dark');
  const [theme, setTheme] = useState({});
  const [logoLight, setLogoLight] = useState(null as string | null);
  const [logoDark, setLogoDark] = useState(null as string | null);

  useEffect(() => {
    if (primaryColor) kv.setItem("primaryColor", primaryColor);
    if (secondaryColor) kv.setItem("secondaryColor", secondaryColor);
    if (logoLight) kv.setItem("logoLight", logoLight);
    if (logoDark) kv.setItem("logoDark", logoDark);
    // if (mode) kv.setItem("mode", mode);
    apply();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryColor, secondaryColor, logoLight, logoDark, mode]);


  const getTheme = (m: BrandingContextType["mode"]): Theme => {
    return m === "light" ? light : dark;
  };



  const getPeristent = async () => {
    const _primaryColor = await kv.getItem("primaryColor");
    const _secondaryColor = await kv.getItem("secondaryColor");
    const _logoLight = await kv.getItem("logoLight");
    const _logoDark = await kv.getItem("logoDark");
    const _mode = await kv.getItem("mode");
    loading.current = false;
    return { _primaryColor, _secondaryColor, _logoLight, _logoDark, _mode };
  };

  useEffect(() => {
    const init = () => {
      getPeristent().then((result) => {
        setPrimaryColor(result._primaryColor || defaultPrimaryColor);
        setSecondaryColor(result._secondaryColor || defaultSecondaryColor);
        setLogoLight(result._logoLight);
        setLogoDark(result._logoDark);
        setMode(result._mode);
        apply();
      });
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLogo = (logo: string, type: string) => {
    if (type === "light") {
      if (logo) {
        kv.setItem("logoLight", logo);
        setLogoLight(logo);
      }
    } else {
      kv.setItem("logoDark", logo);
      setLogoDark(logo);
    }
  };

  const updateMode = (mode: BrandingContextType["mode"]) => {
    if (mode) {
      kv.setItem("mode", mode);
      setMode(mode);
      apply();
    }
  };

  const apply = () => {
    console.log("applying branding")
    // const _mode = 'dark'
    const base = getTheme(mode);
    document.body.style.backgroundColor = base.palette.background.default;
    document.documentElement.style.backgroundColor =  base.palette.background.default;
    const newTheme: Theme = createTheme({
      breakpoints: {
        ...base.breakpoints,
      },
      palette: {
        ...base.palette,
        mode: mode === "light" ? "light" : "dark",
        primary: primaryColor ? primaryColor : base.palette.primary,
        secondary: secondaryColor ? secondaryColor : base.palette.secondary,
        text: {
          primary: mode === "light" ? "#000000" : "#FFFFFF",
        },
      },
      typography: {
        ...base.typography,
      },
      components: {
        ...base.components,
      },
    });
    setTheme(newTheme);
  };

  const reset = () => {
    console.log("resetting branding")
    kv.setItem("mode", "light");
    kv.setItem("primaryColor", { main: "#FF5C42" });
    kv.setItem("secondaryColor", { main: "#0F0F0F" });
    kv.removeItem("logoLight");
    kv.removeItem("logoDark");
    setMode("light");
    setPrimaryColor({ main: "#FF5C42" });
    setSecondaryColor({ main: "#0F0F0F" });
    setLogoLight(null);
    setLogoDark(null);
    apply();
  };

  return (
    <BrandingContext.Provider
      value={{
        primaryColor,
        setPrimaryColor,
        secondaryColor,
        setSecondaryColor,
        mode,
        setMode,
        theme,
        reset,
        updateLogo,
        updateMode,
        apply,
        logoLight,
        logoDark,
      }}
    >
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </BrandingContext.Provider>
  );
}

export default BrandingContext;
