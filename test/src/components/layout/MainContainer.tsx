import React from "react";
import { Container } from "@mui/material";

export function MainContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container
      sx={{
        flexGrow: 1,
        pt: { xs: 8 },
        pl: { xs: 4 },
        pr: { xs: 4 },
        height: "calc(100vh - 100px)",
        display: "flex",
      }}
    >
      {children}
    </Container>
  );
}

export default MainContainer;
