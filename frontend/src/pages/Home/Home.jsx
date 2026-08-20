import {
    PlayCircleOutlined,
    BookOutlined,
    SoundOutlined,
    BarChartOutlined,
    ChromeOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";

import "./Home.css";

const features = [
    {
        icon: <PlayCircleOutlined />,
        title: "Learn with YouTube",
        description:
            "Turn your favorite YouTube videos into interactive English lessons.",
    },
    {
        icon: <BookOutlined />,
        title: "Build Your Vocabulary",
        description:
            "Save useful words while watching and review them whenever you want.",
    },
    {
        icon: <SoundOutlined />,
        title: "Improve Listening",
        description:
            "Listen to real English, follow subtitles and understand natural conversations.",
    },
    {
        icon: <BarChartOutlined />,
        title: "Track Your Progress",
        description:
            "See your learning progress, vocabulary growth and daily study streak.",
    },
];

const steps = [
    {
        number: "01",
        title: "Install the extension",
        description:
            "Add Language Memory to your browser and start learning directly on YouTube.",
    },
    {
        number: "02",
        title: "Watch & learn",
        description:
            "Watch videos with bilingual subtitles and discover new words naturally.",
    },
    {
        number: "03",
        title: "Save & review",
        description:
            "Save useful vocabulary and review it later with spaced repetition.",
    },
];

function Home() {
    return (
        <div className="home">
            {/* ================= NAVBAR ================= */}
            <header className="home-navbar">
                <div className="container navbar-inner">
                    <div className="logo">
                        <div className="logo-icon">L</div>
                        <span>Language Memory</span>
                    </div>

                    <nav className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#about">About</a>
                    </nav>

                    <div className="nav-actions">
                        <a href="/login" className="login-btn">
                            Log in
                        </a>

                        <a href="/register" className="signup-btn">
                            Get Started
                        </a>
                    </div>
                </div>
            </header>

            {/* ================= HERO ================= */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-text">
                        <div className="hero-badge">
                            <ChromeOutlined />
                            Learn English with YouTube
                        </div>

                        <h1>
                            Learn English
                            <br />
                            <span>naturally.</span>
                        </h1>

                        <p className="hero-description">
                            Turn everyday YouTube videos into personalized
                            English lessons. Watch, listen, discover vocabulary,
                            and improve your English naturally.
                        </p>

                        <div className="hero-actions">
                            <a href="/register" className="primary-btn">
                                Start Learning
                                <ArrowRightOutlined />
                            </a>

                            <button className="secondary-btn">
                                <PlayCircleOutlined />
                                See how it works
                            </button>
                        </div>

                        <div className="hero-note">
                            Free to get started · Learn at your own pace
                        </div>
                    </div>

                    <div className="hero-preview">
                        <div className="browser-window">
                            <div className="browser-header">
                                <div className="browser-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>

                                <div className="browser-address">
                                    youtube.com/watch
                                </div>
                            </div>

                            <div className="video-preview">
                                <div className="video-content">
                                    <div className="video-title">
                                        Building Better Habits
                                    </div>

                                    <div className="play-button">
                                        <PlayCircleOutlined />
                                    </div>

                                    <div className="subtitle-box">
                                        <div>
                                            I wanted to change my habits.
                                        </div>

                                        <span>
                                            Tôi muốn thay đổi thói quen của mình.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="floating-card vocabulary-floating">
                            <div className="floating-icon">📚</div>

                            <div>
                                <strong>actually</strong>
                                <span>/ˈæk.tʃu.ə.li/</span>
                            </div>
                        </div>

                        <div className="floating-card progress-floating">
                            <div className="progress-icon">🔥</div>

                            <div>
                                <strong>12 day streak</strong>
                                <span>Keep going!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FEATURES ================= */}
            <section id="features" className="features-section">
                <div className="container">
                    <div className="section-heading">
                        <span>POWERFUL LEARNING TOOLS</span>

                        <h2>
                            Everything you need to
                            <br />
                            improve your English
                        </h2>

                        <p>
                            Language Memory combines watching, listening,
                            vocabulary and progress tracking in one learning
                            experience.
                        </p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature) => (
                            <div className="feature-card" key={feature.title}>
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>

                                <h3>{feature.title}</h3>

                                <p>{feature.description}</p>

                                <a href="#how-it-works">
                                    Learn more
                                    <ArrowRightOutlined />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= HOW IT WORKS ================= */}
            <section id="how-it-works" className="how-section">
                <div className="container">
                    <div className="section-heading">
                        <span>HOW IT WORKS</span>

                        <h2>
                            Learn English without
                            <br />
                            changing your routine
                        </h2>

                        <p>
                            Instead of memorizing endless word lists, learn
                            English from content you already enjoy.
                        </p>
                    </div>

                    <div className="steps-grid">
                        {steps.map((step) => (
                            <div className="step-card" key={step.number}>
                                <div className="step-number">
                                    {step.number}
                                </div>

                                <h3>{step.title}</h3>

                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= LEARNING EXPERIENCE ================= */}
            <section className="experience-section">
                <div className="container experience">
                    <div className="experience-image">
                        <div className="dashboard-preview">
                            <div className="preview-header">
                                <div>
                                    <span>Good evening 👋</span>
                                    <strong>Keep learning today!</strong>
                                </div>

                                <div className="preview-avatar">
                                    P
                                </div>
                            </div>

                            <div className="preview-stats">
                                <div>
                                    <strong>12</strong>
                                    <span>Day streak 🔥</span>
                                </div>

                                <div>
                                    <strong>248</strong>
                                    <span>Words 📚</span>
                                </div>

                                <div>
                                    <strong>37</strong>
                                    <span>Videos 🎬</span>
                                </div>
                            </div>

                            <div className="preview-progress">
                                <div className="progress-heading">
                                    <span>Today's goal</span>
                                    <strong>70%</strong>
                                </div>

                                <div className="progress-track">
                                    <div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="experience-text">
                        <span className="section-label">
                            YOUR LEARNING JOURNEY
                        </span>

                        <h2>
                            Make progress you
                            <br />
                            can actually see.
                        </h2>

                        <p>
                            Every word you save and every video you watch
                            contributes to your learning journey.
                        </p>

                        <ul>
                            <li>
                                <span>✓</span>
                                Personalized vocabulary collection
                            </li>

                            <li>
                                <span>✓</span>
                                Daily learning goals
                            </li>

                            <li>
                                <span>✓</span>
                                Learning streaks and achievements
                            </li>

                            <li>
                                <span>✓</span>
                                Detailed progress statistics
                            </li>
                        </ul>

                        <a href="/register" className="primary-btn">
                            Start your journey
                            <ArrowRightOutlined />
                        </a>
                    </div>
                </div>
            </section>

            {/* ================= STATISTICS ================= */}
            <section className="stats-section">
                <div className="container stats-grid">
                    <div>
                        <strong>10K+</strong>
                        <span>Learners</span>
                    </div>

                    <div>
                        <strong>50K+</strong>
                        <span>Words learned</span>
                    </div>

                    <div>
                        <strong>20K+</strong>
                        <span>Videos studied</span>
                    </div>

                    <div>
                        <strong>100K+</strong>
                        <span>Learning sessions</span>
                    </div>
                </div>
            </section>

            {/* ================= CTA ================= */}
            <section id="about" className="cta-section">
                <div className="container cta-content">
                    <span>START LEARNING TODAY</span>

                    <h2>
                        Your next English
                        <br />
                        lesson is already on YouTube.
                    </h2>

                    <p>
                        Start learning from the videos you love.
                    </p>

                    <a href="/register" className="primary-btn">
                        Get Started
                        <ArrowRightOutlined />
                    </a>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="footer">
                <div className="container footer-inner">
                    <div className="footer-brand">
                        <div className="logo">
                            <div className="logo-icon">L</div>
                            <span>Language Memory</span>
                        </div>

                        <p>
                            Learn English naturally through the content
                            you love.
                        </p>
                    </div>

                    <div className="footer-links">
                        <div>
                            <strong>Product</strong>
                            <a href="#features">Features</a>
                            <a href="/extension">Extension</a>
                            <a href="/lessons">Lessons</a>
                        </div>

                        <div>
                            <strong>Resources</strong>
                            <a href="/help">Help</a>
                            <a href="/about">About</a>
                        </div>

                        <div>
                            <strong>Account</strong>
                            <a href="/login">Log in</a>
                            <a href="/register">Register</a>
                        </div>
                    </div>
                </div>

                <div className="container footer-bottom">
                    <span>© 2026 Language Memory</span>

                    <div>
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;