import React from "react";
import { Link } from "react-router-dom";

interface NavbarProps { }

const Navbar: React.FC<NavbarProps> = () => {
    return (
        <nav
            className="navbar-main"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: "#1f2937",
                color: "white",
                padding: "20px 24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            {/* Brand */}
            <Link
                to="/"
                style={{
                    color: "white",
                    textDecoration: "none",
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                }}
            >
                Language Memory
            </Link>

            {/* Navigation */}
            <ul
                style={{
                    display: "flex",
                    gap: "24px",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                }}
            >

                <li>
                    <Link
                        to="/dashboard"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        Dashboard
                    </Link>
                </li>

                <li>
                    <Link
                        to="/vocabulary"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        Vocabulary
                    </Link>
                </li>

                <li>
                    <Link
                        to="/review"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        Review
                    </Link>
                </li>

                <li>
                    <Link
                        to="/video-history"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        Video History
                    </Link>
                </li>

                <li>
                    <Link
                        to="/settings"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        Settings
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;