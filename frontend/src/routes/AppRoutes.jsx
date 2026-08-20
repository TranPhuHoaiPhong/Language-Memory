import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
// import Login from "../pages/Login/Login";
// import Register from "../pages/Register/Register";
// import Dashboard from "../pages/Dashboard/Dashboard";
import Vocabulary from "../pages/Vocabulary/Vocabulary";
// import Lessons from "../pages/Lessons/Lessons";
// import LessonDetail from "../pages/LessonDetail/LessonDetail";
// import Listening from "../pages/Listening/Listening";
// import Review from "../pages/Review/Review";
// import Progress from "../pages/Progress/Progress";
// import Achievements from "../pages/Achievements/Achievements";
// import Extension from "../pages/Extension/Extension";
// import Profile from "../pages/Profile/Profile";
// import Settings from "../pages/Settings/Settings";
// import Help from "../pages/Help/Help";
// import About from "../pages/About/About";
// import NotFound from "../pages/NotFound/NotFound";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />

                {/* <Route path="/login" element={<Login />} /> */}
                {/* <Route path="/register" element={<Register />} /> */}

                {/* <Route path="/dashboard" element={<Dashboard />} /> */}

                <Route path="/vocabulary" element={<Vocabulary />} />

                {/* <Route path="/lessons" element={<Lessons />} /> */}
                {/* <Route path="/lessons/:id" element={<LessonDetail />} /> */}

                {/* <Route path="/listening" element={<Listening />} /> */}

                {/* <Route path="/review" element={<Review />} /> */}

                {/* <Route path="/progress" element={<Progress />} /> */}

                {/* <Route path="/achievements" element={<Achievements />} /> */}

                {/* <Route path="/extension" element={<Extension />} /> */}

                {/* <Route path="/profile" element={<Profile />} /> */}

                {/* <Route path="/settings" element={<Settings />} /> */}

                {/* <Route path="/help" element={<Help />} /> */}

                {/* <Route path="/about" element={<About />} /> */}

                {/* <Route path="*" element={<NotFound />} /> */}
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;