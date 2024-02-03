import * as React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { BrandingProvider } from "../contexts/BrandingContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { Provide384 } from "@384/core";
import { config } from "../config";
import Error404 from "./Error404";
import DropZoneTest from "./DropZoneTest";
const AppRoutes = () => {
    return (
        <BrandingProvider>
            <NotificationProvider>
                <CssBaseline />
                <Provide384 config={config}>
                    <Router>
                        <Routes>
                            <Route path="/" element={<h1>Welcome to Home!</h1>} />
                            <Route path="/dropzone" element={<DropZoneTest />} />
                            <Route path="/error" element={<Error404 />} />
                            <Route path="*" element={<Error404 />} />
                        </Routes>
                    </Router>
                </Provide384>
            </NotificationProvider>
        </BrandingProvider>
    );
};

export default AppRoutes;
