import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { BrandingProvider } from "../contexts/BrandingContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import SnackabraProvider from "@384/core/contexts/SnackabraContext";
import { config } from "../config";
import Error404 from "./Error404";
import DropZone from "./DropZoneTest";
import { Provide384 } from "@384/core";
import MessagesPropagation from "./MessagesPropagation";
const AppRoutes = () => {
    return (
        <BrandingProvider>
            <NotificationProvider>
                <CssBaseline />
                <Provide384 config={config as any}>
                    <Router>
                        <Routes>
                            <Route path="/" element={<h1>Welcome to Home!</h1>} />
                            <Route path="/dropzone" element={<DropZone/>} />
                            <Route path="/messages/:id" element={<MessagesPropagation/>} />
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
