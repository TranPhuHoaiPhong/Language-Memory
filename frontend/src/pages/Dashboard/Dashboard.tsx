import "./Dashboard.css";

const stats = [
    {
        icon: "🔥",
        label: "Day streak",
        value: "12",
    },
    {
        icon: "📚",
        label: "Words",
        value: "248",
    },
    {
        icon: "🎬",
        label: "Videos",
        value: "37",
    },
    {
        icon: "⏱️",
        label: "Learning time",
        value: "18.5h",
    },
];

const weeklyData = [
    { day: "Mon", value: 40 },
    { day: "Tue", value: 55 },
    { day: "Wed", value: 30 },
    { day: "Thu", value: 70 },
    { day: "Fri", value: 90 },
    { day: "Sat", value: 60 },
    { day: "Sun", value: 85 },
];

const recentVideos = [
    {
        title: "Friends",
        words: 24,
    },
    {
        title: "BBC Learning English",
        words: 18,
    },
    {
        title: "MrBeast",
        words: 31,
    },
];

const reviewWords = [
    {
        word: "actually",
        pronunciation: "/ˈæk.tʃu.ə.li/",
    },
    {
        word: "eventually",
        pronunciation: "/ɪˈven.tʃu.ə.li/",
    },
    {
        word: "experience",
        pronunciation: "/ɪkˈspɪə.ri.əns/",
    },
];

const Dashboard = () => {
    const maxWeekly = Math.max(
        ...weeklyData.map((item) => item.value),
        1
    );

    return (
        <div className="dashboard">

            {/* ================= GREETING ================= */}

            <div className="greeting">
                <h1>Good evening, Phong 👋</h1>
                <p>Your learning progress</p>
            </div>


            {/* ================= STATS ================= */}

            <div className="stats-grid">

                {stats.map((stat) => (
                    <div
                        className="stat-card"
                        key={stat.label}
                    >

                        <div className="stat-icon">
                            {stat.icon}
                        </div>

                        <div className="stat-content">

                            <strong className="stat-value">
                                {stat.value}
                            </strong>

                            <span className="stat-label">
                                {stat.label}
                            </span>

                        </div>

                    </div>
                ))}

            </div>


            {/* ================= WEEKLY ACTIVITY ================= */}

            <section className="section">

                <div className="section-header">
                    <h2>Weekly Activity</h2>
                </div>

                <div className="weekly-chart">

                    {weeklyData.map((item, index) => {

                        const height =
                            Math.max(
                                5,
                                (item.value / maxWeekly) * 100
                            );

                        const isToday = index === 6;

                        return (
                            <div
                                className="bar-wrapper"
                                key={item.day}
                            >

                                <div
                                    className={
                                        isToday
                                            ? "bar bar-today"
                                            : "bar"
                                    }
                                    style={{
                                        height: `${height}px`,
                                    }}
                                />

                                <span className="day-label">
                                    {item.day}
                                </span>

                            </div>
                        );
                    })}

                </div>

            </section>


            {/* ================= RECENT VIDEOS ================= */}

            <section className="section">

                <div className="section-header">
                    <h2>Recent videos</h2>
                </div>

                <div className="video-list">

                    {recentVideos.map((video) => (

                        <div
                            className="video-item"
                            key={video.title}
                        >

                            <span className="video-title">
                                ▶ {video.title}
                            </span>

                            <span className="video-words">
                                {video.words} words
                            </span>

                        </div>

                    ))}

                </div>

            </section>


            {/* ================= VOCABULARY ================= */}

            <section className="section">

                <div className="section-header">
                    <h2>Vocabulary to review</h2>
                </div>

                <div className="word-list">

                    {reviewWords.map((item) => (

                        <div
                            className="word-item"
                            key={item.word}
                        >

                            <span className="word">
                                {item.word}
                            </span>

                            <span className="pronunciation">
                                {item.pronunciation}
                            </span>

                        </div>

                    ))}

                </div>

            </section>

        </div>
    );
};

export default Dashboard;