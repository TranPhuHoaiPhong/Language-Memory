import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useLayoutEffect,
} from "react";

import { useNavigate } from "react-router-dom";

import {
    Button,
    Card,
    Dropdown,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Tooltip,
    Typography,
    message,
} from "antd";

import {
    ArrowLeftOutlined,
    SoundOutlined,
    ReloadOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    MoreOutlined,
    EditOutlined,
    FolderOutlined,
    DeleteOutlined,
    PlusOutlined,
} from "@ant-design/icons";

import "./Detail.css";

import subtitles from "../../data/subtitle.json";
import Navbar from "../../components/Navbar/Navbar";

const {
    Title,
    Text,
} = Typography;

const Detail = () => {
    const navigate = useNavigate();

    // =========================================================
    // REFS
    // =========================================================

    const playerRef = useRef(null);
    const transcriptRefs = useRef({});
    const listRef = useRef(null);
    const timerRef = useRef(null);

    // Dùng để phân biệt single click và double click
    const clickTimerRef = useRef(null);

    // =========================================================
    // MESSAGE
    // =========================================================

    const [messageApi, contextHolder] =
        message.useMessage();

    // =========================================================
    // VIDEO STATE
    // =========================================================

    const [ready, setReady] =
        useState(false);

    const [isPlaying, setIsPlaying] =
        useState(false);

    const [currentTime, setCurrentTime] =
        useState(0);

    const [activeSubtitle, setActiveSubtitle] =
        useState(null);

    // =========================================================
    // VOCABULARY STATE
    // =========================================================

    const [
        vocabularyWords,
        setVocabularyWords,
    ] = useState([
        {
            id: 1,

            word: "Boredom",

            ipa: "/ˈbɔː.dəm/",

            type: "Noun",

            meaning:
                "sự nhàm chán, sự buồn tẻ",

            example:
                "Because I lost boredom.",

            exampleVi:
                "Bởi vì tôi đã đánh mất sự nhàm chán.",

            savedAt:
                "Aug 20, 2026",

            folders: [
                "english-c1",
            ],

            notes: "",
        },
    ]);

    // =========================================================
    // EDIT MODAL
    // =========================================================

    const [editModalOpen, setEditModalOpen] =
        useState(false);

    const [editingWord, setEditingWord] =
        useState(null);

    const [editForm] =
        Form.useForm();

    // =========================================================
    // FOLDERS
    // =========================================================

    const [folders, setFolders] =
        useState([
            {
                id: "english-c1",
                name: "English C1",
            },
            {
                id: "daily-english",
                name: "Daily English",
            },
            {
                id: "business",
                name: "Business English",
            },
            {
                id: "to-review",
                name: "To Review",
            },
        ]);

    // =========================================================
    // MOVE FOLDER MODAL
    // =========================================================

    const [moveModalOpen, setMoveModalOpen] =
        useState(false);

    const [movingWord, setMovingWord] =
        useState(null);

    const [
        selectedMoveFolders,
        setSelectedMoveFolders,
    ] = useState([]);

    // =========================================================
    // CREATE FOLDER MODAL
    // =========================================================

    const [
        createFolderModalOpen,
        setCreateFolderModalOpen,
    ] = useState(false);

    const [
        newFolderName,
        setNewFolderName,
    ] = useState("");

    // =========================================================
    // VIDEO DATA
    // =========================================================

    const videoId = "ylgguuxREy4";

    const subtitlesData = subtitles;

    // =========================================================
    // SCROLL TO TOP
    // =========================================================

    useLayoutEffect(() => {
        if ("scrollRestoration" in history) {
            history.scrollRestoration =
                "manual";
        }

        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "auto",
            });
        };

        scrollToTop();

        const animationFrame =
            requestAnimationFrame(() => {
                scrollToTop();
            });

        const timeoutId =
            setTimeout(() => {
                scrollToTop();
            }, 100);

        return () => {
            cancelAnimationFrame(
                animationFrame
            );

            clearTimeout(timeoutId);

            if ("scrollRestoration" in history) {
                history.scrollRestoration =
                    "auto";
            }
        };
    }, []);

    // =========================================================
    // STOP TRACKING
    // =========================================================

    const stopTracking =
        useCallback(() => {
            if (timerRef.current) {
                clearInterval(
                    timerRef.current
                );

                timerRef.current = null;
            }
        }, []);

    // =========================================================
    // UPDATE ACTIVE SUBTITLE
    // =========================================================

    const updateActiveSubtitle =
        useCallback(
            (time) => {
                const subtitle =
                    subtitlesData.find(
                        (item) =>
                            time >= item.start &&
                            time < item.end
                    );

                const newId =
                    subtitle?.id ?? null;

                setActiveSubtitle(
                    (previous) =>
                        previous === newId
                            ? previous
                            : newId
                );
            },
            [subtitlesData]
        );

    // =========================================================
    // START TRACKING
    // =========================================================

    const startTracking =
        useCallback(() => {
            stopTracking();

            timerRef.current =
                setInterval(() => {
                    if (!playerRef.current) {
                        return;
                    }

                    const time =
                        playerRef.current.getCurrentTime();

                    setCurrentTime(time);

                    updateActiveSubtitle(
                        time
                    );
                }, 200);
        }, [
            stopTracking,
            updateActiveSubtitle,
        ]);

    // =========================================================
    // PLAYER STATE CHANGE
    // =========================================================

    const handlePlayerStateChange =
        useCallback(
            (event) => {
                const YT =
                    window.YT;

                if (!YT) {
                    return;
                }

                if (
                    event.data ===
                    YT.PlayerState.PLAYING
                ) {
                    setIsPlaying(true);

                    startTracking();
                }

                else if (
                    event.data ===
                        YT.PlayerState.PAUSED ||
                    event.data ===
                        YT.PlayerState.ENDED
                ) {
                    setIsPlaying(false);

                    stopTracking();
                }
            },
            [
                startTracking,
                stopTracking,
            ]
        );

    // =========================================================
    // CREATE YOUTUBE PLAYER
    // =========================================================

    useEffect(() => {
        const createPlayer = () => {
            if (!window.YT?.Player) {
                return;
            }

            playerRef.current =
                new window.YT.Player(
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

                            onStateChange:
                                handlePlayerStateChange,
                        },
                    }
                );
        };

        if (window.YT?.Player) {
            createPlayer();
        }

        else {
            const existingScript =
                document.querySelector(
                    'script[src="https://www.youtube.com/iframe_api"]'
                );

            if (!existingScript) {
                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://www.youtube.com/iframe_api";

                script.async = true;

                document.body.appendChild(
                    script
                );
            }

            window.onYouTubeIframeAPIReady =
                createPlayer;
        }

        return () => {
            stopTracking();

            if (clickTimerRef.current) {
                clearTimeout(
                    clickTimerRef.current
                );
            }

            if (playerRef.current) {
                playerRef.current.destroy();

                playerRef.current = null;
            }
        };
    }, [
        videoId,
        handlePlayerStateChange,
        stopTracking,
    ]);

    // =========================================================
    // AUTO SCROLL TRANSCRIPT
    // =========================================================

    useEffect(() => {
        if (
            activeSubtitle === null ||
            !listRef.current
        ) {
            return;
        }

        const element =
            transcriptRefs.current[
                activeSubtitle
            ];

        if (!element) {
            return;
        }

        const container =
            listRef.current;

        const containerRect =
            container.getBoundingClientRect();

        const elementRect =
            element.getBoundingClientRect();

        const offset =
            elementRect.top -
            containerRect.top -
            containerRect.height / 2 +
            elementRect.height / 2;

        container.scrollBy({
            top: offset,
            behavior: "smooth",
        });
    }, [activeSubtitle]);

    // =========================================================
    // TOGGLE PLAY
    // =========================================================

    const togglePlay =
        useCallback(() => {
            if (!playerRef.current) {
                return;
            }

            const YT =
                window.YT;

            if (!YT) {
                return;
            }

            const state =
                playerRef.current.getPlayerState();

            if (
                state ===
                YT.PlayerState.PLAYING
            ) {
                playerRef.current.pauseVideo();
            }

            else {
                playerRef.current.playVideo();
            }
        }, []);

    // =========================================================
    // PAUSE VIDEO
    // =========================================================

    const pauseVideo =
        useCallback(() => {
            if (!playerRef.current) {
                return;
            }

            playerRef.current.pauseVideo();

            setIsPlaying(false);

            stopTracking();
        }, [stopTracking]);

    // =========================================================
    // PLAY SUBTITLE
    // =========================================================

    const playSubtitle =
        useCallback(
            (subtitle) => {
                if (!playerRef.current) {
                    return;
                }

                playerRef.current.seekTo(
                    subtitle.start,
                    true
                );

                playerRef.current.playVideo();

                setActiveSubtitle(
                    subtitle.id
                );
            },
            []
        );

    // =========================================================
    // GET SELECTED TEXT
    // =========================================================

    const getSelectedText =
        useCallback(() => {
            const selection =
                window.getSelection();

            if (!selection) {
                return "";
            }

            return selection
                .toString()
                .trim();
        }, []);

    // =========================================================
    // CLEAN WORD
    // =========================================================

    const cleanSelectedWord =
        useCallback(
            (text) => {
                return text
                    .replace(
                        /^[.,!?;:"'()[\]{}]+/,
                        ""
                    )
                    .replace(
                        /[.,!?;:"'()[\]{}]+$/,
                        ""
                    )
                    .trim();
            },
            []
        );

    // =========================================================
    // CREATE SAMPLE WORD
    // =========================================================

    const createSampleWord =
        useCallback(
            (selectedText, subtitle) => {
                const cleanWord =
                    cleanSelectedWord(
                        selectedText
                    );

                if (!cleanWord) {
                    return;
                }

                const newWord = {
                    id:
                        `${Date.now()}-${Math.random()}`,

                    word:
                        cleanWord,

                    ipa:
                        "/sample/",

                    type:
                        "Unknown",

                    meaning:
                        `Sample meaning for "${cleanWord}"`,

                    example:
                        subtitle?.text || "",

                    exampleVi:
                        subtitle?.translation || "",

                    savedAt:
                        new Date()
                            .toLocaleDateString(
                                "en-US",
                                {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                }
                            ),

                    folders: [],

                    notes: "",
                };

                setVocabularyWords(
                    (current) => {
                        const exists =
                            current.some(
                                (item) =>
                                    item.word
                                        .toLowerCase()
                                        .trim() ===
                                    newWord.word
                                        .toLowerCase()
                                        .trim()
                            );

                        if (exists) {
                            return current;
                        }

                        return [
                            newWord,
                            ...current,
                        ];
                    }
                );
            },
            [cleanSelectedWord]
        );

    // =========================================================
    // HANDLE TEXT SELECTION
    // =========================================================

    const handleTextSelection =
        useCallback(
            (subtitle) => {
                setTimeout(() => {
                    const selectedText =
                        getSelectedText();

                    if (!selectedText) {
                        return;
                    }

                    // Có text được bôi đen
                    // => dừng video
                    pauseVideo();

                    // Tạo dữ liệu mẫu
                    createSampleWord(
                        selectedText,
                        subtitle
                    );

                    // Hủy click timer
                    if (
                        clickTimerRef.current
                    ) {
                        clearTimeout(
                            clickTimerRef.current
                        );

                        clickTimerRef.current =
                            null;
                    }
                }, 0);
            },
            [
                getSelectedText,
                pauseVideo,
                createSampleWord,
            ]
        );

    // =========================================================
    // HANDLE SINGLE CLICK
    // =========================================================

    const handleSingleClick =
        useCallback(
            (subtitle) => {
                if (
                    clickTimerRef.current
                ) {
                    return;
                }

                clickTimerRef.current =
                    setTimeout(() => {
                        const selectedText =
                            getSelectedText();

                        // Nếu đang chọn text
                        // thì không tua video
                        if (selectedText) {
                            clickTimerRef.current =
                                null;

                            return;
                        }

                        // Click bình thường
                        // => tua video
                        playSubtitle(
                            subtitle
                        );

                        clickTimerRef.current =
                            null;
                    }, 250);
            },
            [
                getSelectedText,
                playSubtitle,
            ]
        );

    // =========================================================
    // HANDLE DOUBLE CLICK
    // =========================================================

    const handleDoubleClick =
        useCallback(
            (event, subtitle) => {
                // Hủy single click
                if (
                    clickTimerRef.current
                ) {
                    clearTimeout(
                        clickTimerRef.current
                    );

                    clickTimerRef.current =
                        null;
                }

                // Đợi browser chọn text
                setTimeout(() => {
                    const selectedText =
                        getSelectedText();

                    // Double click luôn pause
                    pauseVideo();

                    if (selectedText) {
                        createSampleWord(
                            selectedText,
                            subtitle
                        );
                    }
                }, 0);
            },
            [
                getSelectedText,
                pauseVideo,
                createSampleWord,
            ]
        );

    // =========================================================
    // REPLAY SAVED WORD
    // =========================================================

    const replaySavedWord =
        useCallback(() => {
            if (!playerRef.current) {
                return;
            }

            playerRef.current.seekTo(
                15,
                true
            );

            playerRef.current.playVideo();
        }, []);

    // =========================================================
    // FORMAT TIME
    // =========================================================

    const formatTime =
        useCallback(
            (seconds) => {
                const minutes =
                    Math.floor(
                        seconds / 60
                    );

                const secs =
                    Math.floor(
                        seconds % 60
                    );

                return `${String(
                    minutes
                ).padStart(
                    2,
                    "0"
                )}:${String(
                    secs
                ).padStart(
                    2,
                    "0"
                )}`;
            },
            []
        );

    // =========================================================
    // PRONOUNCE
    // =========================================================

    const handlePronounce =
        useCallback(
            (word) => {
                if (
                    !(
                        "speechSynthesis" in
                        window
                    )
                ) {
                    return;
                }

                const utterance =
                    new SpeechSynthesisUtterance(
                        word
                    );

                utterance.lang =
                    "en-US";

                utterance.rate =
                    0.8;

                window.speechSynthesis.cancel();

                window.speechSynthesis.speak(
                    utterance
                );
            },
            []
        );

    // =========================================================
    // FOLDER OPTIONS
    // =========================================================

    const folderOptions =
        folders.map(
            (folder) => ({
                value: folder.id,
                label: folder.name,
            })
        );

    // =========================================================
    // OPEN EDIT MODAL
    // =========================================================

    const openEditModal =
        (word) => {
            setEditingWord(word);

            editForm.setFieldsValue({
                word: word.word,
                ipa: word.ipa,
                meaning:
                    word.meaning,
                type: word.type,
                notes: word.notes,
            });

            setEditModalOpen(true);
        };

    // =========================================================
    // SAVE EDIT WORD
    // =========================================================

    const handleEditWord =
        async () => {
            if (!editingWord) {
                return;
            }

            try {
                const values =
                    await editForm.validateFields();

                setVocabularyWords(
                    (current) =>
                        current.map(
                            (word) => {
                                if (
                                    word.id !==
                                    editingWord.id
                                ) {
                                    return word;
                                }

                                return {
                                    ...word,

                                    word:
                                        values.word,

                                    ipa:
                                        values.ipa,

                                    meaning:
                                        values.meaning,

                                    type:
                                        values.type,

                                    notes:
                                        values.notes ||
                                        "",
                                };
                            }
                        )
                );

                setEditModalOpen(false);

                setEditingWord(null);

                messageApi.success(
                    "Word updated successfully."
                );
            }

            catch (error) {
                console.error(
                    "Failed to update word:",
                    error
                );
            }
        };

    // =========================================================
    // OPEN MOVE MODAL
    // =========================================================

    const openMoveModal =
        (word) => {
            setMovingWord(word);

            setSelectedMoveFolders(
                word.folders || []
            );

            setMoveModalOpen(true);
        };

    // =========================================================
    // SAVE WORD FOLDERS
    // =========================================================

    const handleMoveWord =
        () => {
            if (!movingWord) {
                return;
            }

            setVocabularyWords(
                (current) =>
                    current.map(
                        (word) => {
                            if (
                                word.id !==
                                movingWord.id
                            ) {
                                return word;
                            }

                            return {
                                ...word,

                                folders:
                                    selectedMoveFolders,
                            };
                        }
                    )
            );

            setMoveModalOpen(false);

            setMovingWord(null);

            messageApi.success(
                "Word folders updated successfully."
            );
        };

    // =========================================================
    // CREATE NEW FOLDER
    // =========================================================

    const createFolder =
        () => {
            const name =
                newFolderName.trim();

            if (!name) {
                messageApi.warning(
                    "Please enter a folder name."
                );

                return;
            }

            const exists =
                folders.some(
                    (folder) =>
                        folder.name
                            .toLowerCase() ===
                        name.toLowerCase()
                );

            if (exists) {
                messageApi.warning(
                    "This folder already exists."
                );

                return;
            }

            const newFolder = {
                id:
                    `folder-${Date.now()}`,

                name,
            };

            setFolders(
                (current) => [
                    ...current,
                    newFolder,
                ]
            );

            setNewFolderName("");

            setCreateFolderModalOpen(
                false
            );

            messageApi.success(
                "Folder created successfully."
            );
        };

    // =========================================================
    // REMOVE WORD
    // =========================================================

    const removeWord =
        (word) => {
            Modal.confirm({
                title:
                    `Remove "${word.word}"?`,

                content:
                    "This word will be removed from your vocabulary.",

                okText:
                    "Remove",

                cancelText:
                    "Cancel",

                okButtonProps: {
                    danger: true,
                },

                onOk: () => {
                    setVocabularyWords(
                        (current) =>
                            current.filter(
                                (item) =>
                                    item.id !==
                                    word.id
                            )
                    );

                    messageApi.success(
                        "Word removed from your vocabulary."
                    );
                },
            });
        };

    // =========================================================
    // CREATE DROPDOWN MENU
    // =========================================================

    const getMenuItems =
        (word) => [
            {
                key: "edit",

                icon:
                    <EditOutlined />,

                label:
                    "Edit word",

                onClick: () =>
                    openEditModal(word),
            },

            {
                key: "move",

                icon:
                    <FolderOutlined />,

                label:
                    "Move to folder",

                onClick: () =>
                    openMoveModal(word),
            },

            {
                type:
                    "divider",
            },

            {
                key: "delete",

                danger: true,

                icon:
                    <DeleteOutlined />,

                label:
                    "Remove from vocabulary",

                onClick: () =>
                    removeWord(word),
            },
        ];

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <>
            {contextHolder}

            <div className="detail-page-wrapper">

                <Navbar />

                <div className="detail-page">

                    <div className="detail-container">

                        {/* BACK */}

                        <div className="back-button-wrapper">

                            <Button
                                icon={
                                    <ArrowLeftOutlined />
                                }
                                onClick={() =>
                                    navigate(-1)
                                }
                            >
                                Back
                            </Button>

                        </div>

                        {/* VIDEO + TRANSCRIPT */}

                        <div className="detail-content">

                            {/* VIDEO */}

                            <div className="video-section">

                                <Card
                                    className="video-card"
                                    styles={{
                                        body: {
                                            padding: 0,
                                        },
                                    }}
                                >

                                    <div className="video-wrapper">

                                        <div
                                            id="youtube-player"
                                        />

                                    </div>

                                </Card>

                                <Button
                                    type="primary"
                                    icon={
                                        <ReloadOutlined />
                                    }
                                    size="large"
                                    block
                                    loading={!ready}
                                    onClick={
                                        replaySavedWord
                                    }
                                    className="replay-btn"
                                >
                                    Replay the saved word
                                </Button>

                            </div>

                            {/* TRANSCRIPT */}

                            <div className="transcript-section">

                                <Card
                                    className="transcript-card"
                                    styles={{
                                        body: {
                                            padding: 0,
                                        },
                                    }}
                                >

                                    <div className="transcript-header">

                                        <Title
                                            level={3}
                                            style={{
                                                margin: 0,
                                            }}
                                        >
                                            Transcript
                                        </Title>

                                        <Space>

                                            <Tooltip title="Play / Pause">

                                                <Button
                                                    type="text"
                                                    shape="circle"
                                                    icon={
                                                        isPlaying
                                                            ? (
                                                                <PauseCircleOutlined />
                                                            )
                                                            : (
                                                                <PlayCircleOutlined />
                                                            )
                                                    }
                                                    onClick={
                                                        togglePlay
                                                    }
                                                    disabled={
                                                        !ready
                                                    }
                                                />

                                            </Tooltip>

                                            <Text type="secondary">
                                                {formatTime(
                                                    currentTime
                                                )}
                                            </Text>

                                        </Space>

                                    </div>

                                    <div
                                        className="transcript-list"
                                        ref={listRef}
                                    >

                                        {subtitlesData.map(
                                            (
                                                subtitle
                                            ) => {
                                                const active =
                                                    activeSubtitle ===
                                                    subtitle.id;

                                                return (
                                                    <div
                                                        key={
                                                            subtitle.id
                                                        }

                                                        ref={(
                                                            element
                                                        ) => {
                                                            transcriptRefs.current[
                                                                subtitle.id
                                                            ] =
                                                                element;
                                                        }}

                                                        className={
                                                            `transcript-item ${
                                                                active
                                                                    ? "active"
                                                                    : ""
                                                            }`
                                                        }

                                                        onMouseUp={() =>
                                                            handleTextSelection(
                                                                subtitle
                                                            )
                                                        }

                                                        onClick={() =>
                                                            handleSingleClick(
                                                                subtitle
                                                            )
                                                        }

                                                        onDoubleClick={(
                                                            event
                                                        ) =>
                                                            handleDoubleClick(
                                                                event,
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

                                                            {
                                                                subtitle.text
                                                            }

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

                        {/* VOCABULARY TABLE */}

                        <div className="vocabulary-table">

                            {/* HEADER */}

                            <div className="vocabulary-table-header">

                                <div className="table-column word-column">
                                    WORD
                                </div>

                                <div className="table-column meaning-column">
                                    MEANING
                                </div>

                                <div className="table-column example-column">
                                    EXAMPLE
                                </div>

                                <div className="table-column saved-column">
                                    SAVED
                                </div>

                                <div className="table-column actions-column">
                                </div>

                            </div>

                            {/* WORDS */}

                            {vocabularyWords.map(
                                (word) => (
                                    <div
                                        className="vocabulary-table-row"
                                        key={word.id}
                                    >

                                        {/* WORD */}

                                        <div className="table-column word-column">

                                            <div className="word-content">

                                                <Tooltip title="Pronounce">

                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        className="word-sound-button"
                                                        icon={
                                                            <SoundOutlined />
                                                        }
                                                        onClick={() =>
                                                            handlePronounce(
                                                                word.word
                                                            )
                                                        }
                                                    />

                                                </Tooltip>

                                                <div className="word-info">

                                                    <div className="word-title">

                                                        {
                                                            word.word
                                                        }

                                                    </div>

                                                    <div className="word-ipa">

                                                        {
                                                            word.ipa
                                                        }

                                                    </div>

                                                    <div className="word-type">

                                                        {
                                                            word.type
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                        {/* MEANING */}

                                        <div className="table-column meaning-column">

                                            <div className="meaning-text">

                                                {
                                                    word.meaning
                                                }

                                            </div>

                                        </div>

                                        {/* EXAMPLE */}

                                        <div className="table-column example-column">

                                            <div className="example-en">

                                                {
                                                    word.example
                                                }

                                            </div>

                                            <div className="example-vi">

                                                {
                                                    word.exampleVi
                                                }

                                            </div>

                                        </div>

                                        {/* SAVED */}

                                        <div className="table-column saved-column">

                                            <div className="saved-text">

                                                {
                                                    word.savedAt
                                                }

                                            </div>

                                        </div>

                                        {/* ACTIONS */}

                                        <div className="table-column actions-column">

                                            <Tooltip title="More actions">

                                                <Dropdown
                                                    menu={{
                                                        items:
                                                            getMenuItems(
                                                                word
                                                            ),
                                                    }}
                                                    trigger={[
                                                        "click",
                                                    ]}
                                                    placement="bottomRight"
                                                >

                                                    <Button
                                                        type="text"
                                                        className="more-button"
                                                        icon={
                                                            <MoreOutlined />
                                                        }
                                                    />

                                                </Dropdown>

                                            </Tooltip>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                    </div>

                </div>

                {/* EDIT WORD MODAL */}

                <Modal
                    open={editModalOpen}
                    title="Edit word"
                    okText="Save"
                    cancelText="Cancel"
                    onCancel={() => {
                        setEditModalOpen(false);
                        setEditingWord(null);
                    }}
                    onOk={handleEditWord}
                    destroyOnClose
                >

                    <Form
                        form={editForm}
                        layout="vertical"
                    >

                        <Form.Item
                            label="Word"
                            name="word"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter the word.",
                                },
                            ]}
                        >

                            <Input />

                        </Form.Item>

                        <Form.Item
                            label="IPA"
                            name="ipa"
                        >

                            <Input />

                        </Form.Item>

                        <Form.Item
                            label="Meaning"
                            name="meaning"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter the meaning.",
                                },
                            ]}
                        >

                            <Input />

                        </Form.Item>

                        <Form.Item
                            label="Part of speech"
                            name="type"
                        >

                            <Select
                                options={[
                                    {
                                        value: "Noun",
                                        label: "Noun",
                                    },
                                    {
                                        value: "Verb",
                                        label: "Verb",
                                    },
                                    {
                                        value: "Adjective",
                                        label: "Adjective",
                                    },
                                    {
                                        value: "Adverb",
                                        label: "Adverb",
                                    },
                                    {
                                        value: "Pronoun",
                                        label: "Pronoun",
                                    },
                                    {
                                        value: "Preposition",
                                        label: "Preposition",
                                    },
                                    {
                                        value: "Conjunction",
                                        label: "Conjunction",
                                    },
                                    {
                                        value: "Other",
                                        label: "Other",
                                    },
                                ]}
                            />

                        </Form.Item>

                        <Form.Item
                            label="Notes"
                            name="notes"
                        >

                            <Input.TextArea
                                rows={4}
                                placeholder="Add a personal note..."
                            />

                        </Form.Item>

                    </Form>

                </Modal>

                {/* MOVE FOLDER MODAL */}

                <Modal
                    open={moveModalOpen}
                    title={
                        movingWord
                            ? `Move "${movingWord.word}"`
                            : "Move to folder"
                    }
                    okText="Save"
                    cancelText="Cancel"
                    onCancel={() => {
                        setMoveModalOpen(false);
                        setMovingWord(null);
                    }}
                    onOk={handleMoveWord}
                    destroyOnClose
                >

                    <div
                        style={{
                            marginBottom: 16,
                        }}
                    >

                        <Text type="secondary">
                            Select one or more folders
                            for this word.
                        </Text>

                    </div>

                    <Select
                        mode="multiple"
                        value={selectedMoveFolders}
                        onChange={
                            setSelectedMoveFolders
                        }
                        style={{
                            width: "100%",
                        }}
                        placeholder="Select folders"
                        options={folderOptions}
                    />

                    <Button
                        type="link"
                        icon={
                            <PlusOutlined />
                        }
                        style={{
                            paddingLeft: 0,
                            marginTop: 8,
                        }}
                        onClick={() => {
                            setCreateFolderModalOpen(
                                true
                            );
                        }}
                    >
                        Create new folder
                    </Button>

                </Modal>

                {/* CREATE FOLDER MODAL */}

                <Modal
                    open={createFolderModalOpen}
                    title="Create new folder"
                    okText="Create"
                    cancelText="Cancel"
                    onCancel={() => {
                        setCreateFolderModalOpen(
                            false
                        );

                        setNewFolderName("");
                    }}
                    onOk={createFolder}
                    destroyOnClose
                >

                    <Input
                        autoFocus
                        value={newFolderName}
                        placeholder="e.g. Travel English"
                        onChange={(e) => {
                            setNewFolderName(
                                e.target.value
                            );
                        }}
                        onPressEnter={
                            createFolder
                        }
                    />

                </Modal>

            </div>
        </>
    );
};

export default Detail;