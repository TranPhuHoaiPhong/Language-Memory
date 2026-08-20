
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    Divider,
    Space,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    SoundOutlined,
    ReloadOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
} from "@ant-design/icons";

import "./Detail.css";
import subtitles from "../../data/subtitle.json";

const { Title, Text, Paragraph } = Typography;

interface Subtitle {
    id: number;
    start: number;
    end: number;
    text: string;
    translation: string;
}

const Detail: React.FC = () => {
    const navigate = useNavigate();

    const playerRef = useRef<any>(null);
    const transcriptRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const listRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [ready, setReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeSubtitle, setActiveSubtitle] = useState<number | null>(null);

    const videoId = "ylgguuxREy4";
    const subtitlesData = subtitles as Subtitle[];

    // =========================
    // Word information
    // =========================

    const wordInfo = {
        word: "Boredom",
        ipa: "/ˈbɔː.dəm/",
        type: "Noun",
        meaning: "sự nhàm chán, sự buồn tẻ",
        example:
            "Over the past few weeks, months, years, I felt a little foggy. No focus. My mind was always occupied. Why was that? Because I lost boredom.",
        exampleVi:
            "Trong vài tuần, vài tháng, vài năm qua, tôi cảm thấy hơi mơ hồ. Không tập trung. Đầu óc tôi luôn bận rộn. Tại sao vậy? Bởi vì tôi đã đánh mất sự nhàm chán.",
    };

    // =========================
    // Scroll top
    // =========================

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // =========================
    // YouTube API
    // =========================

    useEffect(() => {
        const createPlayer = () => {
            playerRef.current = new (window as any).YT.Player(
                "youtube-player",
                {
                    videoId,
                    playerVars: {
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                    },
                    events: {
                        onReady: () => {
                            setReady(true);
                        },
                        onStateChange: handlePlayerStateChange,
                    },
                }
            );
        };

        if ((window as any).YT?.Player) {
            createPlayer();
        } else {
            const existingScript = document.querySelector(
                'script[src="https://www.youtube.com/iframe_api"]'
            );

            if (!existingScript) {
                const script = document.createElement("script");

                script.src = "https://www.youtube.com/iframe_api";
                script.async = true;

                document.body.appendChild(script);
            }

            (window as any).onYouTubeIframeAPIReady = () => {
                createPlayer();
            };
        }

        return () => {
            stopTracking();

            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, []);

    // =========================
    // Player state
    // =========================

    const handlePlayerStateChange = (event: any) => {
        const YT = (window as any).YT;

        if (!YT) return;

        if (event.data === YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startTracking();
        }

        if (
            event.data === YT.PlayerState.PAUSED ||
            event.data === YT.PlayerState.ENDED
        ) {
            setIsPlaying(false);
            stopTracking();
        }
    };

    // =========================
    // Time tracking
    // =========================

    const startTracking = () => {
        stopTracking();

        timerRef.current = setInterval(() => {
            if (!playerRef.current) return;

            const time = playerRef.current.getCurrentTime();

            setCurrentTime(time);
            updateActiveSubtitle(time);
        }, 200);
    };

    const stopTracking = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const updateActiveSubtitle = (time: number) => {
        const subtitle = subtitlesData.find(
            (item) => time >= item.start && time < item.end
        );

        const newId = subtitle?.id ?? null;

        setActiveSubtitle((prev) =>
            prev === newId ? prev : newId
        );
    };

    // =========================
    // Auto scroll transcript
    // =========================

    useEffect(() => {
        if (activeSubtitle === null || !listRef.current) {
            return;
        }

        const el = transcriptRefs.current[activeSubtitle];

        if (!el) return;

        const container = listRef.current;

        const containerRect =
            container.getBoundingClientRect();

        const elRect =
            el.getBoundingClientRect();

        const offset =
            elRect.top -
            containerRect.top -
            containerRect.height / 2 +
            elRect.height / 2;

        container.scrollBy({
            top: offset,
            behavior: "smooth",
        });
    }, [activeSubtitle]);

    // =========================
    // Player controls
    // =========================

    const togglePlay = () => {
        if (!playerRef.current) return;

        const state =
            playerRef.current.getPlayerState();

        const YT = (window as any).YT;

        if (!YT) return;

        if (state === YT.PlayerState.PLAYING) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const seek = (seconds: number) => {
        if (!playerRef.current) return;

        const current =
            playerRef.current.getCurrentTime();

        playerRef.current.seekTo(
            Math.max(0, current + seconds),
            true
        );

        playerRef.current.playVideo();
    };

    const playSubtitle = (subtitle: Subtitle) => {
        if (!playerRef.current) return;

        playerRef.current.seekTo(
            subtitle.start,
            true
        );

        playerRef.current.playVideo();

        setActiveSubtitle(subtitle.id);
    };

    const replaySavedWord = () => {
        if (!playerRef.current) return;

        playerRef.current.seekTo(15, true);
        playerRef.current.playVideo();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);

        return `${String(m).padStart(2, "0")}:${String(
            s
        ).padStart(2, "0")}`;
    };

    // =========================
    // Render
    // =========================

    return (
        <div className="vocabulary-page">

            {/* =========================
                Back button
            ========================= */}

            <div className="back-button-wrapper">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                >
                    Back
                </Button>
            </div>

            <div className="vocabulary-grid">

                {/* =========================
                    LEFT COLUMN
                ========================= */}

                <div className="video-column">

                    {/* Video */}

                    <Card
                        className="video-card"
                        styles={{
                            body: {
                                padding: 0,
                            },
                        }}
                    >
                        <div className="video-wrapper">
                            <div id="youtube-player" />
                        </div>
                    </Card>

                    {/* Saved word replay */}

                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        size="large"
                        block
                        loading={!ready}
                        onClick={replaySavedWord}
                        className="replay-btn"
                    >
                        Replay the saved word
                    </Button>

                    {/* Word card */}

                    <Card className="word-card">

                        <Space
                            direction="vertical"
                            size={18}
                            style={{ width: "100%" }}
                        >

                            {/* Header */}

                            <div>
                                <Text type="secondary">
                                    Word
                                </Text>

                                <div className="word-row">

                                    <div>
                                        <Title
                                            level={2}
                                            style={{
                                                margin: 0,
                                            }}
                                        >
                                            {wordInfo.word}
                                        </Title>

                                        <Text
                                            type="secondary"
                                            className="ipa"
                                        >
                                            {wordInfo.ipa}
                                        </Text>
                                    </div>

                                    <Tooltip title="Play pronunciation">
                                        <Button
                                            type="text"
                                            shape="circle"
                                            size="large"
                                            icon={
                                                <SoundOutlined />
                                            }
                                            onClick={() => { }}
                                        />
                                    </Tooltip>

                                </div>
                            </div>

                            {/* Word type */}

                            <Tag color="blue">
                                {wordInfo.type}
                            </Tag>

                            {/* Meaning */}

                            <div>
                                <Text strong>
                                    Meaning:
                                </Text>

                                <Paragraph
                                    style={{
                                        marginBottom: 0,
                                        marginTop: 4,
                                    }}
                                >
                                    {wordInfo.meaning}
                                </Paragraph>
                            </div>

                            <Divider />

                            {/* Example */}

                            <div>
                                <Text type="secondary">
                                    Example
                                </Text>

                                <Paragraph
                                    style={{
                                        marginTop: 8,
                                        marginBottom: 8,
                                    }}
                                >
                                    {wordInfo.example}
                                </Paragraph>

                                <Paragraph
                                    type="secondary"
                                    italic
                                    style={{
                                        marginBottom: 0,
                                    }}
                                >
                                    {wordInfo.exampleVi}
                                </Paragraph>
                            </div>

                        </Space>
                    </Card>
                </div>

                {/* =========================
                    RIGHT COLUMN
                ========================= */}

                <div className="transcript-container">

                    <Card
                        className="transcript-card"
                        styles={{
                            body: {
                                padding: 0,
                            },
                        }}
                    >

                        {/* Transcript header */}

                        <div className="transcript-header">

                            <div>
                                <Title
                                    level={3}
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    Transcript
                                </Title>

                                <Text type="secondary">
                                    Click a sentence to play
                                    from that point
                                </Text>
                            </div>

                            <Space>

                                <Tooltip title="Play / Pause">
                                    <Button
                                        type="text"
                                        shape="circle"
                                        icon={
                                            isPlaying ? (
                                                <PauseCircleOutlined />
                                            ) : (
                                                <PlayCircleOutlined />
                                            )
                                        }
                                        onClick={togglePlay}
                                        disabled={!ready}
                                    />
                                </Tooltip>

                                <Text type="secondary">
                                    {formatTime(
                                        currentTime
                                    )}
                                </Text>

                            </Space>

                        </div>

                        {/* Transcript */}

                        <div
                            className="transcript-list"
                            ref={listRef}
                        >
                            {subtitlesData.map(
                                (subtitle) => {
                                    const active =
                                        activeSubtitle ===
                                        subtitle.id;

                                    return (
                                        <div
                                            key={
                                                subtitle.id
                                            }
                                            ref={(el) => {
                                                transcriptRefs.current[
                                                    subtitle.id
                                                ] = el;
                                            }}
                                            className={`transcript-item ${active
                                                    ? "active"
                                                    : ""
                                                }`}
                                            onClick={() =>
                                                playSubtitle(
                                                    subtitle
                                                )
                                            }
                                        >

                                            <div className="time">
                                                {formatTime(
                                                    subtitle.start
                                                )}
                                            </div>

                                            <div className="en">
                                                {subtitle.text}
                                            </div>

                                            <div className="vi">
                                                {
                                                    subtitle.translation
                                                }
                                            </div>

                                        </div>
                                    );
                                }
                            )}
                        </div>

                    </Card>
                </div>

            </div>
        </div>
    );
};

export default Detail;
