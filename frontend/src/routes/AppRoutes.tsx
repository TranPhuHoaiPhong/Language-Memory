import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Register from "../pages/Register/Register";

import Vocabulary from "../pages/Vocabulary/Vocabulary";
import Review from "../pages/Review/Review";
import Settings from "../pages/Settings/Settings";
import VideoHistory from "../pages/VideoHistory/VideoHistory";

export default function AppRoutes() {
    return (
        <Routes>

            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />

            <Route path="/vocabulary" element={<Vocabulary />} />

            <Route path="/review" element={<Review />} />

            <Route path="/settings" element={<Settings />} />

            <Route path="/video-history" element={<VideoHistory />} />

        </Routes>
    );
}