import { Card, Col, List, Row, Statistic, Typography, Progress } from "antd";
import {
    FireOutlined,
    BookOutlined,
    VideoCameraOutlined,
    ClockCircleOutlined,
    PlayCircleOutlined,
    SoundOutlined,
    RiseOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import "./Dashboard.css";

const { Title, Text } = Typography;

// ================= STATS =================
const stats = [
    {
        icon: <FireOutlined />,
        label: "Day streak",
        value: 12,
        color: "#fa541c",
        bgColor: "#fff1f0",
    },
    {
        icon: <BookOutlined />,
        label: "Words learned",
        value: 248,
        color: "#1890ff",
        bgColor: "#e6f7ff",
    },
    {
        icon: <VideoCameraOutlined />,
        label: "Videos watched",
        value: 37,
        color: "#722ed1",
        bgColor: "#f9f0ff",
    },
    {
        icon: <ClockCircleOutlined />,
        label: "Learning time",
        value: 18.5,
        suffix: "h",
        color: "#13c2c2",
        bgColor: "#e6fffb",
    },
];

// ================= WEEKLY DATA =================
const weeklyData = [
    { day: "Mon", value: 40 },
    { day: "Tue", value: 55 },
    { day: "Wed", value: 30 },
    { day: "Thu", value: 70 },
    { day: "Fri", value: 90 },
    { day: "Sat", value: 60 },
    { day: "Sun", value: 85 },
];

// ================= RECENT VIDEOS =================
const recentVideos = [
    { title: "Friends – The One with the Embryos", words: 24, icon: "🎬" },
    { title: "BBC Learning English – 6 Minute English", words: 18, icon: "📻" },
    { title: "MrBeast – Last to Leave Challenge", words: 31, icon: "📺" },
];

// ================= REVIEW WORDS =================
const reviewWords = [
    { word: "actually", pronunciation: "/ˈæk.tʃu.ə.li/", mastered: true },
    { word: "eventually", pronunciation: "/ɪˈven.tʃu.ə.li/", mastered: false },
    { word: "experience", pronunciation: "/ɪkˈspɪə.ri.əns/", mastered: false },
];

// ================= DASHBOARD =================
const Dashboard = () => {
    const maxWeekly = Math.max(...weeklyData.map((item) => item.value), 1);
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const todayIndex = today === 0 ? 6 : today - 1; // Adjust to match weeklyData (Mon=0)

    return (
        <div className="dashboard">

            {/* ===== GREETING ===== */}
            <div className="dashboard-greeting">
                <Title level={2} className="greeting-title">
                    Good evening, Phong 👋
                </Title>
                <Text type="secondary" className="greeting-sub">
                    Here's your learning progress today
                </Text>
            </div>

            {/* ===== STATS ===== */}
            <Row gutter={[16, 16]} className="stats-row">
                {stats.map((stat) => (
                    <Col xs={24} sm={12} lg={6} key={stat.label}>
                        <Card className="stat-card" hoverable>
                            <div className="stat-content">
                                <div
                                    className="stat-icon-wrapper"
                                    style={{ backgroundColor: stat.bgColor }}
                                >
                                    <span style={{ color: stat.color }}>{stat.icon}</span>
                                </div>
                                <Statistic
                                    title={<span className="stat-label">{stat.label}</span>}
                                    value={stat.value}
                                    suffix={stat.suffix}
                                    valueStyle={{ color: stat.color, fontWeight: 600 }}
                                />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ===== WEEKLY ACTIVITY ===== */}
            <Card
                title={
                    <span className="section-title">
                        <RiseOutlined style={{ marginRight: 8 }} />
                        Weekly Activity
                    </span>
                }
                className="dashboard-card"
            >
                <div className="weekly-chart">
                    {weeklyData.map((item, index) => {
                        const height = Math.max(5, (item.value / maxWeekly) * 100);
                        const isToday = index === todayIndex;

                        return (
                            <div className="bar-wrapper" key={item.day}>
                                <div className="bar-container">
                                    <div
                                        className={`bar ${isToday ? "bar-today" : ""}`}
                                        style={{ height: `${height}%` }}
                                    />
                                </div>
                                <Text
                                    type={isToday ? undefined : "secondary"}
                                    strong={isToday}
                                    className="bar-label"
                                >
                                    {item.day}
                                </Text>
                                <Text type="secondary" className="bar-value">
                                    {item.value}
                                </Text>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* ===== RECENT VIDEOS & VOCABULARY (two columns) ===== */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card
                        title={
                            <span className="section-title">
                                <PlayCircleOutlined style={{ marginRight: 8 }} />
                                Recent Videos
                            </span>
                        }
                        className="dashboard-card"
                    >
                        <List
                            dataSource={recentVideos}
                            renderItem={(video) => (
                                <List.Item
                                    extra={
                                        <Text type="secondary" className="word-count">
                                            {video.words} words
                                        </Text>
                                    }
                                    className="video-item"
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <span className="video-emoji">{video.icon}</span>
                                        }
                                        title={<Text strong>{video.title}</Text>}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title={
                            <span className="section-title">
                                <SoundOutlined style={{ marginRight: 8 }} />
                                Vocabulary to Review
                            </span>
                        }
                        className="dashboard-card"
                    >
                        <List
                            dataSource={reviewWords}
                            renderItem={(item) => (
                                <List.Item className="word-item">
                                    <List.Item.Meta
                                        avatar={
                                            <div className="word-status">
                                                {item.mastered ? (
                                                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                                ) : (
                                                    <SoundOutlined style={{ color: "#faad14" }} />
                                                )}
                                            </div>
                                        }
                                        title={<Text strong>{item.word}</Text>}
                                        description={item.pronunciation}
                                    />
                                    <div className="word-progress">
                                        <Progress
                                            type="circle"
                                            percent={item.mastered ? 100 : 40}
                                            width={32}
                                            strokeColor={item.mastered ? "#52c41a" : "#faad14"}
                                            showInfo={false}
                                        />
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;