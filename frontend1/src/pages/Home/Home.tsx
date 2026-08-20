import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Row, Space, Typography } from "antd";
import {
    RocketOutlined,
    ChromeOutlined,
    StarFilled,
    ThunderboltOutlined,
} from "@ant-design/icons";

import ModalAuth from "../../components/ModalAuth/ModalAuth";
import "./Home.css";

const { Title, Paragraph, Text } = Typography;

export default function Home() {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleGetStarted = () => {
        const token = localStorage.getItem("token");

        if (token) {
            navigate("/dashboard");
        } else {
            setShowModal(true);
        }
    };

    const handleLoginSuccess = (token: string) => {
        // Nếu ModalAuth chưa tự lưu token thì có thể lưu tại đây
        // localStorage.setItem("token", token);

        navigate("/dashboard");
    };

    return (
        <>
            {/* ===== HERO ===== */}
            <section className="hero">
                <div className="container hero-container">
                    <Row
                        gutter={[64, 48]}
                        align="middle"
                        justify="space-between"
                    >
                        {/* ===== LEFT CONTENT ===== */}
                        <Col xs={24} lg={12}>
                            <div className="hero-content">
                                {/* Badge */}
                                <div className="hero-badge">
                                    <ThunderboltOutlined />
                                    <span>AI-Powered Language Learning</span>
                                </div>

                                {/* Title */}
                                <Title level={1} className="hero-title">
                                    Transform Every YouTube Video
                                    <br />
                                    <span className="gradient-text">
                                        into a Language Lesson
                                    </span>
                                </Title>

                                {/* Description */}
                                <Paragraph className="hero-description">
                                    Language Memory is an AI-powered learning
                                    platform that helps you understand videos,
                                    save vocabulary, master grammar, improve
                                    pronunciation, and review everything with
                                    smart flashcards.
                                </Paragraph>

                                {/* Buttons */}
                                <Space
                                    className="hero-buttons"
                                    size="middle"
                                    wrap
                                >
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<RocketOutlined />}
                                        onClick={handleGetStarted}
                                        className="get-started-btn"
                                    >
                                        Get Started
                                    </Button>

                                    <Button
                                        size="large"
                                        icon={<ChromeOutlined />}
                                        className="extension-btn"
                                        onClick={() => {
                                            // Sau này thay bằng link Chrome Web Store
                                            console.log(
                                                "Install Chrome Extension"
                                            );
                                        }}
                                    >
                                        Install Chrome Extension
                                    </Button>
                                </Space>

                                {/* Stats */}
                                <Row
                                    gutter={[32, 24]}
                                    className="hero-stats"
                                >
                                    <Col xs={8}>
                                        <div className="stat-item">
                                            <Text className="stat-number">
                                                12k+
                                            </Text>
                                            <Text className="stat-label">
                                                Active Learners
                                            </Text>
                                        </div>
                                    </Col>

                                    <Col xs={8}>
                                        <div className="stat-item">
                                            <Text className="stat-number">
                                                340k
                                            </Text>
                                            <Text className="stat-label">
                                                Words Saved
                                            </Text>
                                        </div>
                                    </Col>

                                    <Col xs={8}>
                                        <div className="stat-item">
                                            <Text className="stat-number rating">
                                                4.9
                                                <StarFilled />
                                            </Text>
                                            <Text className="stat-label">
                                                User Rating
                                            </Text>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </Col>

                        {/* ===== RIGHT VISUAL ===== */}
                        <Col xs={24} lg={12}>
                            <div className="hero-visual">
                                {/* Mockup của bạn đặt ở đây */}

                                <div className="video-mockup">
                                    <div className="mockup-header">
                                        <div className="mockup-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>

                                    <div className="mockup-video">
                                        <div className="play-button">
                                            ▶
                                        </div>
                                    </div>

                                    <div className="mockup-subtitle">
                                        <p>
                                            Learning a new language can change
                                            your life.
                                        </p>
                                        <span>
                                            Học một ngôn ngữ mới có thể thay đổi
                                            cuộc sống của bạn.
                                        </span>
                                    </div>
                                </div>

                                <div className="floating-card vocabulary-card">
                                    <span className="card-icon">📚</span>
                                    <div>
                                        <strong>Vocabulary Saved</strong>
                                        <p>+5 new words</p>
                                    </div>
                                </div>

                                <div className="floating-card ai-card">
                                    <span className="card-icon">✨</span>
                                    <div>
                                        <strong>AI Translation</strong>
                                        <p>Instant & Smart</p>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* ===== MODAL AUTH ===== */}
            <ModalAuth
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </>
    );
}