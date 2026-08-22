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
    Divider,
    Dropdown,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Tag,
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
    Paragraph,
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
    // WORD STATE
    // =========================================================

    const [wordInfo, setWordInfo] =
        useState({
            word: "Boredom",

            ipa: "/ˈbɔː.dəm/",

            type: "Noun",

            meaning:
                "sự nhàm chán, sự buồn tẻ",

            example:
                "Over the past few weeks, months, years, I felt a little foggy. No focus. My mind was always occupied. Why was that? Because I lost boredom.",

            exampleVi:
                "Trong vài tuần, vài tháng, vài năm qua, tôi cảm thấy hơi mơ hồ. Không tập trung. Đầu óc tôi luôn bận rộn. Tại sao vậy? Bởi vì tôi đã đánh mất sự nhàm chán.",

            savedAt:
                "Aug 20, 2026",

            folders: [
                "english-c1",
            ],

            notes: "",
        });

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
    // EDIT MODAL
    // =========================================================

    const [editModalOpen, setEditModalOpen] =
        useState(false);

    const [editingWord, setEditingWord] =
        useState(null);

    const [editForm] =
        Form.useForm();

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
            history.scrollRestoration = "manual";
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
                history.scrollRestoration = "auto";
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
        useCallback(() => {
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
                    wordInfo.word
                );

            utterance.lang =
                "en-US";

            utterance.rate =
                0.8;

            window.speechSynthesis.cancel();

            window.speechSynthesis.speak(
                utterance
            );
        }, [wordInfo.word]);

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
        () => {
            setEditingWord(
                wordInfo
            );

            editForm.setFieldsValue({
                word:
                    wordInfo.word,

                ipa:
                    wordInfo.ipa,

                meaning:
                    wordInfo.meaning,

                type:
                    wordInfo.type,

                notes:
                    wordInfo.notes,
            });

            setEditModalOpen(
                true
            );
        };

    // =========================================================
    // SAVE EDIT WORD
    // =========================================================

    const handleEditWord =
        async () => {
            try {
                const values =
                    await editForm.validateFields();

                setWordInfo(
                    (current) => ({
                        ...current,

                        word:
                            values.word,

                        ipa:
                            values.ipa,

                        meaning:
                            values.meaning,

                        type:
                            values.type,

                        notes:
                            values.notes || "",
                    })
                );

                setEditModalOpen(
                    false
                );

                setEditingWord(
                    null
                );

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
        () => {
            setMovingWord(
                wordInfo
            );

            setSelectedMoveFolders(
                wordInfo.folders || []
            );

            setMoveModalOpen(
                true
            );
        };

    // =========================================================
    // SAVE WORD FOLDERS
    // =========================================================

    const handleMoveWord =
        () => {
            if (!movingWord) {
                return;
            }

            setWordInfo(
                (current) => ({
                    ...current,

                    folders:
                        selectedMoveFolders,
                })
            );

            setMoveModalOpen(
                false
            );

            setMovingWord(
                null
            );

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
                        folder.name.toLowerCase() ===
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
        () => {
            Modal.confirm({
                title:
                    "Remove this word?",

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
                    messageApi.success(
                        "Word removed from your vocabulary."
                    );

                    navigate(-1);
                },
            });
        };

    // =========================================================
    // DROPDOWN MENU
    // =========================================================

    const menuItems = [
        {
            key: "edit",

            icon:
                <EditOutlined />,

            label:
                "Edit word",

            onClick:
                openEditModal,
        },

        {
            key: "move",

            icon:
                <FolderOutlined />,

            label:
                "Move to folder",

            onClick:
                openMoveModal,
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

            onClick:
                removeWord,
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

                        {/* =================================================
                        BACK
                        ================================================= */}

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

                        {/* =================================================
                        VIDEO + TRANSCRIPT
                        ================================================= */}

                        <div className="detail-content">

                            {/* =================================================
                            VIDEO
                            ================================================= */}

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

                            {/* =================================================
                            TRANSCRIPT
                            ================================================= */}

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
                                                            ? <PauseCircleOutlined />
                                                            : <PlayCircleOutlined />
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
                                        ref={
                                            listRef
                                        }
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

                                                        ref={(element) => {
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

                        {/* =================================================
                        VOCABULARY TABLE
                        ================================================= */}

                        <div className="vocabulary-table">

                            {/* =================================================
                            TABLE HEADER
                            ================================================= */}

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

                            {/* =================================================
                            TABLE ROW
                            ================================================= */}

                            <div className="vocabulary-table-row">

                                {/* =================================================
                                WORD
                                ================================================= */}

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
                                                onClick={
                                                    handlePronounce
                                                }
                                            />
                                        </Tooltip>

                                        <div className="word-info">

                                            <div className="word-title">
                                                {
                                                    wordInfo.word
                                                }
                                            </div>

                                            <div className="word-ipa">
                                                {
                                                    wordInfo.ipa
                                                }
                                            </div>

                                            <div className="word-type">
                                                {
                                                    wordInfo.type
                                                }
                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* =================================================
                                MEANING
                                ================================================= */}

                                <div className="table-column meaning-column">

                                    <div className="meaning-text">
                                        {
                                            wordInfo.meaning
                                        }
                                    </div>

                                </div>

                                {/* =================================================
                                EXAMPLE
                                ================================================= */}

                                <div className="table-column example-column">

                                    <div className="example-en">
                                        {
                                            wordInfo.example
                                        }
                                    </div>

                                    <div className="example-vi">
                                        {
                                            wordInfo.exampleVi
                                        }
                                    </div>

                                </div>

                                {/* =================================================
                                SAVED
                                ================================================= */}

                                <div className="table-column saved-column">

                                    <div className="saved-text">
                                        {
                                            wordInfo.savedAt
                                        }
                                    </div>

                                </div>

                                {/* =================================================
                                ACTIONS
                                ================================================= */}

                                <div className="table-column actions-column">

                                    <Tooltip title="More actions">

                                        <Dropdown
                                            menu={{
                                                items:
                                                    menuItems,
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

                        </div>

                    </div>

                </div>

                {/* =================================================
                EDIT WORD MODAL
                ================================================= */}

                <Modal
                    open={
                        editModalOpen
                    }

                    title="Edit word"

                    okText="Save"

                    cancelText="Cancel"

                    onCancel={() => {
                        setEditModalOpen(
                            false
                        );

                        setEditingWord(
                            null
                        );
                    }}

                    onOk={
                        handleEditWord
                    }

                    destroyOnClose
                >

                    <Form
                        form={
                            editForm
                        }
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
                                        value:
                                            "Noun",
                                        label:
                                            "Noun",
                                    },
                                    {
                                        value:
                                            "Verb",
                                        label:
                                            "Verb",
                                    },
                                    {
                                        value:
                                            "Adjective",
                                        label:
                                            "Adjective",
                                    },
                                    {
                                        value:
                                            "Adverb",
                                        label:
                                            "Adverb",
                                    },
                                    {
                                        value:
                                            "Pronoun",
                                        label:
                                            "Pronoun",
                                    },
                                    {
                                        value:
                                            "Preposition",
                                        label:
                                            "Preposition",
                                    },
                                    {
                                        value:
                                            "Conjunction",
                                        label:
                                            "Conjunction",
                                    },
                                    {
                                        value:
                                            "Other",
                                        label:
                                            "Other",
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

                {/* =================================================
                MOVE TO FOLDER MODAL
                ================================================= */}

                <Modal
                    open={
                        moveModalOpen
                    }

                    title={
                        movingWord
                            ? `Move "${movingWord.word}"`
                            : "Move to folder"
                    }

                    okText="Save"

                    cancelText="Cancel"

                    onCancel={() => {
                        setMoveModalOpen(
                            false
                        );

                        setMovingWord(
                            null
                        );
                    }}

                    onOk={
                        handleMoveWord
                    }

                    destroyOnClose
                >

                    <div
                        style={{
                            marginBottom:
                                16,
                        }}
                    >

                        <Text type="secondary">
                            Select one or more folders
                            for this word.
                        </Text>

                    </div>

                    <Select
                        mode="multiple"
                        value={
                            selectedMoveFolders
                        }
                        onChange={
                            setSelectedMoveFolders
                        }
                        style={{
                            width: "100%",
                        }}
                        placeholder="Select folders"
                        options={
                            folderOptions
                        }
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

                {/* =================================================
                CREATE FOLDER MODAL
                ================================================= */}

                <Modal
                    open={
                        createFolderModalOpen
                    }

                    title="Create new folder"

                    okText="Create"

                    cancelText="Cancel"

                    onCancel={() => {
                        setCreateFolderModalOpen(
                            false
                        );

                        setNewFolderName("");
                    }}

                    onOk={
                        createFolder
                    }

                    destroyOnClose
                >

                    <Input
                        autoFocus
                        value={
                            newFolderName
                        }
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