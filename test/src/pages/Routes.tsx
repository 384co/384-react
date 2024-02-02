import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { BrandingProvider } from "../contexts/BrandingContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import PageNotFound from "@384/components/PageNotFound";
const AppRoutes = () => {
    return (
        <BrandingProvider>
            <NotificationProvider>
                <CssBaseline />
                <Router>
                    <Routes>
                        <Route path="/" element={<h1>Welcome to Home!</h1>} />
                        <Route path="/error" element={<div style={{ width: '50%' }}><PageNotFound /></div>} />
                        <Route path="*" element={<PageNotFound />} />
                    </Routes>
                </Router>
            </NotificationProvider>
        </BrandingProvider>
    );
};

export default AppRoutes;
