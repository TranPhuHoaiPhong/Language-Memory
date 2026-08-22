import { NavLink, useLocation } from "react-router-dom";

import {
    HomeOutlined,
    BookOutlined,
    UserOutlined,
} from "@ant-design/icons";

import { Menu } from "antd";

import "./Navbar.css";

function Navbar() {
    const location = useLocation();

    const getSelectedKey = () => {
        if (location.pathname === "/dashboard") {
            return "dashboard";
        }

        if (location.pathname.startsWith("/vocabulary")) {
            return "vocabulary";
        }

        if (location.pathname.startsWith("/profile")) {
            return "profile";
        }

        if (location.pathname.startsWith("/detail")) {
            return "vocabulary";
        }

        return "dashboard";
    };

    const items = [
        {
            key: "dashboard",
            icon: <HomeOutlined />,
            label: (
                <NavLink to="/dashboard">
                    Home
                </NavLink>
            ),
        },

        {
            key: "vocabulary",
            icon: <BookOutlined />,
            label: (
                <NavLink to="/vocabulary">
                    Vocabulary
                </NavLink>
            ),
        },

        {
            key: "profile",
            icon: <UserOutlined />,
            label: (
                <NavLink to="/profile">
                    Profile
                </NavLink>
            ),
        },
    ];

    return (
        <header className="navbar">
            <div className="navbar-container">

                {/* LOGO */}

                <NavLink
                    to="/"
                    className="navbar-logo"
                >
                    <div className="navbar-logo-icon">
                        LM
                    </div>

                    <span>
                        Language Memory
                    </span>
                </NavLink>

                {/* MENU */}

                <Menu
                    mode="horizontal"
                    selectedKeys={[
                        getSelectedKey(),
                    ]}
                    items={items}
                    className="navbar-menu"
                />

            </div>
        </header>
    );
}

export default Navbar;