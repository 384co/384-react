import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { BrandingProvider } from "../contexts/BrandingContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import SnackabraProvider from "@384/core/contexts/SnackabraContext";
import { config } from "../config";
import Error404 from "./Error404";
const AppRoutes = () => {
    return (
        <BrandingProvider>
            <NotificationProvider>
                <CssBaseline />
                <SnackabraProvider config={config}>
                    <Router>
                        <Routes>
                            <Route path="/" element={<h1>Welcome to Home!</h1>} />
                            <Route path="/error" element={<Error404 />} />
                            <Route path="*" element={<Error404 />} />
                        </Routes>
                    </Router>
                </SnackabraProvider>
            </NotificationProvider>
        </BrandingProvider>
    );
};

export default AppRoutes;
