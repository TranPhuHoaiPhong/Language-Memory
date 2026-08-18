import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import ModalAuth from "../../components/ModalAuth/ModalAuth";
import "./Home.css";

export default function Home() {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    // Nếu đã có token thì chuyển thẳng vào dashboard
    // useEffect(() => {
    //     const token = localStorage.getItem("token");
    //     if (token) {
    //         navigate("/dashboard");
    //     }
    // }, [navigate]);

    const handleGetStarted = () => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard");
        } else {
            setShowModal(true);
        }
    };

    const handleLoginSuccess = (token: string) => {
        navigate("/dashboard");
    };

    return (
        <>
            {/* <Navbar /> */}

            {/* ===== HERO ===== */}
            <section className="hero">
                <div className="container hero-container">
                    <div className="hero-content">
                        <span className="badge">
                            <i className="fas fa-sparkles"></i> AI-Powered Language Learning
                        </span>
                        <h1>
                            Transform Every YouTube Video<br />
                            <span className="gradient-text">into a Language Lesson</span>
                        </h1>
                        <p className="hero-description">
                            Language Memory is an AI-powered learning platform that helps you
                            understand videos, save vocabulary, master grammar, improve pronunciation,
                            and review everything with smart flashcards.
                        </p>
                        <div className="hero-buttons">
                            <button onClick={handleGetStarted} className="btn btn-primary">
                                <i className="fas fa-rocket"></i> Get Started
                            </button>
                            <a href="#" className="btn btn-secondary">
                                <i className="fab fa-chrome"></i> Install Chrome Extension
                            </a>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">12k+</span>
                                <span className="stat-label">Active Learners</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">340k</span>
                                <span className="stat-label">Words Saved</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">4.9★</span>
                                <span className="stat-label">User Rating</span>
                            </div>
                        </div>
                    </div>

                    {/* Mockup ... giữ nguyên */}
                    <div className="hero-visual">
                        {/* ... */}
                    </div>
                </div>
            </section>

            {/* Modal Auth */}
            <ModalAuth
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </>
    );
}