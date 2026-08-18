import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Detail.css";
import subtitles from "../../data/subtitle.json";

interface Subtitle {
    id: number;
    start: number;
    end: number;
    text: string;
    translation: string;
}

const Detail = () => {
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

    // --- Scroll to top when component mounts ---
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // --- Load YouTube API ---
    useEffect(() => {
        const createPlayer = () => {
            playerRef.current = new (window as any).YT.Player("youtube-player", {
                videoId,
                playerVars: {
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                },
                events: {
                    onReady: () => setReady(true),
                    onStateChange: handlePlayerStateChange,
                },
            });
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
            if (timerRef.current) clearInterval(timerRef.current);
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, []);

    // --- Player state change ---
    const handlePlayerStateChange = (event: any) => {
        const YT = (window as any).YT;
        if (!YT) return;

        if (event.data === YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startTracking();
        }
        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            setIsPlaying(false);
            stopTracking();
        }
    };

    // --- Time tracking ---
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
        setActiveSubtitle((prev) => (prev === newId ? prev : newId));
    };

    // --- Auto-scroll transcript ---
    useEffect(() => {
        if (activeSubtitle === null || !listRef.current) return;
        const el = transcriptRefs.current[activeSubtitle];
        if (!el) return;

        const container = listRef.current;
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const offset = elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
        container.scrollBy({ top: offset, behavior: "smooth" });
    }, [activeSubtitle]);

    // --- Controls ---
    const togglePlay = () => {
        if (!playerRef.current) return;
        const state = playerRef.current.getPlayerState();
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
        const current = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(Math.max(0, current + seconds), true);
        playerRef.current.playVideo();
    };

    const playSubtitle = (subtitle: Subtitle) => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(subtitle.start, true);
        playerRef.current.playVideo();
        setActiveSubtitle(subtitle.id);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const wordInfo = {
        word: "Boredom",
        ipa: "/ˈbɔː.dəm/",
        type: "Noun",
        meaning: "sự nhàm chán, sự buồn tẻ",
        example: "Over the past few weeks, months, years, I felt a little foggy. No focus. My mind was always occupied. Why was that? Because I lost boredom.",
        exampleVi: "Trong vài tuần, vài tháng, vài năm qua, tôi cảm thấy hơi mơ hồ. Không tập trung. Đầu óc tôi luôn bận rộn. Tại sao vậy? Bởi vì tôi đã đánh mất sự nhàm chán.",
    };

    return (
        <div className="vocabulary-page">
            {/* Back button */}
            <div className="back-button-wrapper">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>

            <div className="vocabulary-grid">
                {/* Left: Video */}
                <div className="video-column">
                    <div className="video-wrapper">
                        <div id="youtube-player" />
                    </div>


                    <button
                        className="replay-btn"
                        onClick={() => {
                            if (!playerRef.current) return;
                            playerRef.current.seekTo(15, true);
                            playerRef.current.playVideo();
                        }}
                        disabled={!ready}
                    >
                        ▶ Replay the saved word
                    </button>

                    <div className="word-card">
                        <div className="label">Word</div>
                        <div className="word-row">
                            <div>
                                <div className="word-main">{wordInfo.word}</div>
                                <div className="ipa">{wordInfo.ipa}</div>
                            </div>
                            <button className="audio-btn" onClick={() => { }}>
                                🔊
                            </button>
                        </div>
                        <div className="word-type">{wordInfo.type}</div>
                        <div className="meaning">
                            <strong>Meaning:</strong> {wordInfo.meaning}
                        </div>
                        <div className="divider" />
                        <div className="label">Example</div>
                        <div className="example">{wordInfo.example}</div>
                        <div className="example-trans">{wordInfo.exampleVi}</div>
                    </div>
                </div>

                {/* Right: Transcript */}
                <div className="transcript-container">
                    <div className="transcript-card">
                        <div className="transcript-header">
                            <h2>Transcript</h2>
                            <div className="sub">Click a sentence to play from that point</div>
                        </div>
                        <div className="transcript-list" ref={listRef}>
                            {subtitlesData.map((subtitle) => {
                                const active = activeSubtitle === subtitle.id;
                                return (
                                    <div
                                        key={subtitle.id}
                                        ref={(el) => (transcriptRefs.current[subtitle.id] = el)}
                                        className={`transcript-item ${active ? "active" : ""}`}
                                        onClick={() => playSubtitle(subtitle)}
                                    >
                                        <div className="time">{formatTime(subtitle.start)}</div>
                                        <div className="en">{subtitle.text}</div>
                                        <div className="vi">{subtitle.translation}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Detail;