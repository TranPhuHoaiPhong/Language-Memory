import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
    SearchOutlined,
    SoundOutlined,
    MoreOutlined,
    BookOutlined,
    DeleteOutlined,
    EditOutlined,
    FolderOutlined,
    PlusOutlined,
    SortAscendingOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

import {
    Button,
    Card,
    Dropdown,
    Empty,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tooltip,
    Typography,
    message,
} from "antd";

import "./Vocabulary.css";
import Navbar from "../../components/Navbar/Navbar";

const {
    Title,
    Text,
    Paragraph,
} = Typography;

/* =========================================================
   INITIAL FOLDERS
========================================================= */

const initialFolders = [
    {
        id: "all",
        name: "All Words",
    },
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
];

/* =========================================================
   VOCABULARY DATA
========================================================= */

const vocabularyData = [
    {
        id: 1,
        word: "actually",
        ipa: "/ˈæk.tʃu.ə.li/",
        meaning: "thực sự, thực tế là",
        example:
            "I actually don't know what happened.",
        translation:
            "Thực sự tôi không biết chuyện gì đã xảy ra.",
        type: "Adverb",
        savedAt: "Aug 20, 2026",
        folders: [
            "english-c1",
            "daily-english",
        ],
        notes: "",
        contexts: [
            {
                videoId: "abc123",
                videoTitle:
                    "Building Better Habits",
                timestamp: 134,
            },
            {
                videoId: "xyz456",
                videoTitle:
                    "How to Be Productive",
                timestamp: 342,
            },
        ],
    },

    {
        id: 2,
        word: "habit",
        ipa: "/ˈhæb.ɪt/",
        meaning: "thói quen",
        example:
            "Reading is a good habit.",
        translation:
            "Đọc sách là một thói quen tốt.",
        type: "Noun",
        savedAt: "Aug 20, 2026",
        folders: [
            "daily-english",
        ],
        notes: "",
        contexts: [
            {
                videoId: "abc123",
                videoTitle:
                    "Building Better Habits",
                timestamp: 85,
            },
        ],
    },

    {
        id: 3,
        word: "stimulation",
        ipa: "/ˌstɪm.jəˈleɪ.ʃən/",
        meaning: "sự kích thích",
        example:
            "The brain needs constant stimulation.",
        translation:
            "Bộ não cần sự kích thích liên tục.",
        type: "Noun",
        savedAt: "Aug 19, 2026",
        folders: [
            "english-c1",
        ],
        notes:
            "Often used when talking about the brain.",
        contexts: [
            {
                videoId: "abc123",
                videoTitle:
                    "Building Better Habits",
                timestamp: 211,
            },
        ],
    },

    {
        id: 4,
        word: "discipline",
        ipa: "/ˈdɪs.ə.plɪn/",
        meaning: "kỷ luật",
        example:
            "Success requires discipline.",
        translation:
            "Thành công đòi hỏi tính kỷ luật.",
        type: "Noun",
        savedAt: "Aug 19, 2026",
        folders: [
            "english-c1",
            "to-review",
        ],
        notes: "",
        contexts: [
            {
                videoId: "abc123",
                videoTitle:
                    "Building Better Habits",
                timestamp: 278,
            },
        ],
    },

    {
        id: 5,
        word: "procrastinate",
        ipa: "/prəʊˈkræs.tɪ.neɪt/",
        meaning: "trì hoãn",
        example:
            "I often procrastinate when I feel tired.",
        translation:
            "Tôi thường trì hoãn khi cảm thấy mệt.",
        type: "Verb",
        savedAt: "Aug 18, 2026",
        folders: [
            "daily-english",
            "to-review",
        ],
        notes: "",
        contexts: [
            {
                videoId: "pro123",
                videoTitle:
                    "Why We Procrastinate",
                timestamp: 421,
            },
        ],
    },

    {
        id: 6,
        word: "productive",
        ipa: "/prəˈdʌk.tɪv/",
        meaning: "hiệu quả, năng suất",
        example:
            "I had a very productive day.",
        translation:
            "Tôi đã có một ngày rất hiệu quả.",
        type: "Adjective",
        savedAt: "Aug 18, 2026",
        folders: [
            "daily-english",
        ],
        notes: "",
        contexts: [
            {
                videoId: "prod123",
                videoTitle:
                    "How to Be Productive",
                timestamp: 126,
            },
        ],
    },

    {
        id: 7,
        word: "environment",
        ipa: "/ɪnˈvaɪ.rən.mənt/",
        meaning: "môi trường",
        example:
            "Your environment affects your behavior.",
        translation:
            "Môi trường ảnh hưởng đến hành vi của bạn.",
        type: "Noun",
        savedAt: "Aug 17, 2026",
        folders: [
            "english-c1",
        ],
        notes: "",
        contexts: [
            {
                videoId: "daily123",
                videoTitle:
                    "Daily English",
                timestamp: 192,
            },
        ],
    },

    {
        id: 8,
        word: "consistent",
        ipa: "/kənˈsɪs.tənt/",
        meaning: "nhất quán, đều đặn",
        example:
            "You need to be consistent.",
        translation:
            "Bạn cần phải duy trì đều đặn.",
        type: "Adjective",
        savedAt: "Aug 17, 2026",
        folders: [
            "english-c1",
            "daily-english",
        ],
        notes: "",
        contexts: [
            {
                videoId: "daily123",
                videoTitle:
                    "Daily English",
                timestamp: 314,
            },
        ],
    },
];

/* =========================================================
   STORAGE KEYS
========================================================= */

const SCROLL_KEY =
    "vocabularyScrollPosition";

const FILTER_KEY =
    "vocabularyFilterState";

/* =========================================================
   COMPONENT
========================================================= */

function Vocabulary() {
    const navigate = useNavigate();

    const [messageApi, contextHolder] =
        message.useMessage();

    /* =====================================================
       DATA STATE
    ===================================================== */

    const [words, setWords] =
        useState(vocabularyData);

    const [folders, setFolders] =
        useState(initialFolders);

    /* =====================================================
       FILTER STATE
    ===================================================== */

    const [search, setSearch] =
        useState("");

    const [selectedFolder, setSelectedFolder] =
        useState("all");

    const [sortBy, setSortBy] =
        useState("newest");

    /* =====================================================
       EDIT MODAL STATE
    ===================================================== */

    const [editModalOpen, setEditModalOpen] =
        useState(false);

    const [editingWord, setEditingWord] =
        useState(null);

    const [editForm] =
        Form.useForm();

    /* =====================================================
       MOVE FOLDER MODAL STATE
    ===================================================== */

    const [moveModalOpen, setMoveModalOpen] =
        useState(false);

    const [movingWord, setMovingWord] =
        useState(null);

    const [
        selectedMoveFolders,
        setSelectedMoveFolders,
    ] = useState([]);

    /* =====================================================
       CREATE FOLDER MODAL STATE
    ===================================================== */

    const [
        createFolderModalOpen,
        setCreateFolderModalOpen,
    ] = useState(false);

    const [
        newFolderName,
        setNewFolderName,
    ] = useState("");

    /* =====================================================
       RESTORE FILTER STATE
    ===================================================== */

    useEffect(() => {
        const savedState =
            sessionStorage.getItem(
                FILTER_KEY
            );

        if (!savedState) {
            return;
        }

        try {
            const parsed =
                JSON.parse(savedState);

            if (
                typeof parsed.search ===
                "string"
            ) {
                setSearch(parsed.search);
            }

            if (
                typeof parsed.selectedFolder ===
                "string"
            ) {
                setSelectedFolder(
                    parsed.selectedFolder
                );
            }

            if (
                typeof parsed.sortBy ===
                "string"
            ) {
                setSortBy(
                    parsed.sortBy
                );
            }
        } catch (error) {
            console.error(
                "Failed to restore vocabulary state:",
                error
            );
        }
    }, []);

    /* =====================================================
       RESTORE SCROLL POSITION
    ===================================================== */

    useEffect(() => {
        const savedScroll =
            sessionStorage.getItem(
                SCROLL_KEY
            );

        if (savedScroll === null) {
            return;
        }

        const scrollPosition =
            Number(savedScroll);

        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollPosition,
                behavior: "instant",
            });
        });

        sessionStorage.removeItem(
            SCROLL_KEY
        );
    }, []);

    /* =====================================================
       SAVE CURRENT PAGE STATE
    ===================================================== */

    const saveVocabularyState = () => {
        sessionStorage.setItem(
            FILTER_KEY,
            JSON.stringify({
                search,
                selectedFolder,
                sortBy,
            })
        );

        sessionStorage.setItem(
            SCROLL_KEY,
            String(window.scrollY)
        );
    };

    /* =====================================================
       OPEN WORD DETAIL
    ===================================================== */

    const openWordDetail = (
        word
    ) => {
        saveVocabularyState();

        navigate(
            `/detail/${encodeURIComponent(
                word
            )}`
        );
    };

    /* =====================================================
       FILTER + SORT WORDS
    ===================================================== */

    const filteredWords = useMemo(() => {
        const keyword =
            search.trim().toLowerCase();

        const result =
            words.filter((word) => {
                const matchesSearch =
                    word.word
                        .toLowerCase()
                        .includes(keyword) ||
                    word.meaning
                        .toLowerCase()
                        .includes(keyword);

                const matchesFolder =
                    selectedFolder === "all" ||
                    word.folders.includes(
                        selectedFolder
                    );

                return (
                    matchesSearch &&
                    matchesFolder
                );
            });

        return [...result].sort(
            (a, b) => {
                if (
                    sortBy ===
                    "alphabetical"
                ) {
                    return a.word.localeCompare(
                        b.word
                    );
                }

                if (
                    sortBy ===
                    "reverseAlphabetical"
                ) {
                    return b.word.localeCompare(
                        a.word
                    );
                }

                if (
                    sortBy === "oldest"
                ) {
                    return a.id - b.id;
                }

                return b.id - a.id;
            }
        );
    }, [
        words,
        search,
        selectedFolder,
        sortBy,
    ]);

    /* =====================================================
       SPEAK WORD
    ===================================================== */

    const speakWord = (word) => {
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

        utterance.lang = "en-US";

        utterance.rate = 0.8;

        window.speechSynthesis.cancel();

        window.speechSynthesis.speak(
            utterance
        );
    };

    /* =====================================================
       REMOVE WORD
    ===================================================== */

    const removeWord = (id) => {
        setWords(
            (currentWords) =>
                currentWords.filter(
                    (word) =>
                        word.id !== id
                )
        );

        messageApi.success(
            "Word removed from your vocabulary."
        );
    };

    /* =====================================================
       OPEN EDIT MODAL
    ===================================================== */

    const openEditModal = (
        word
    ) => {
        setEditingWord(word);

        editForm.setFieldsValue({
            word: word.word,
            ipa: word.ipa,
            meaning: word.meaning,
            type: word.type,
            notes: word.notes,
        });

        setEditModalOpen(true);
    };

    /* =====================================================
       SAVE EDIT WORD
    ===================================================== */

    const handleEditWord = async () => {
        try {
            const values =
                await editForm.validateFields();

            if (!editingWord) {
                return;
            }

            setWords(
                (currentWords) =>
                    currentWords.map(
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
        } catch (error) {
            console.error(
                "Failed to update word:",
                error
            );
        }
    };

    /* =====================================================
       OPEN MOVE FOLDER MODAL
    ===================================================== */

    const openMoveModal = (
        word
    ) => {
        setMovingWord(word);

        setSelectedMoveFolders(
            word.folders
        );

        setMoveModalOpen(true);
    };

    /* =====================================================
       SAVE WORD FOLDERS
    ===================================================== */

    const handleMoveWord = () => {
        if (!movingWord) {
            return;
        }

        setWords(
            (currentWords) =>
                currentWords.map(
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

    /* =====================================================
       CREATE NEW FOLDER
    ===================================================== */

    const createFolder = () => {
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
            (currentFolders) => [
                ...currentFolders,
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

    /* =====================================================
    DELETE FOLDER
    ===================================================== */

    const deleteFolder = (folder) => {
        if (folder.id === "all") {
            return;
        }

        Modal.confirm({
            title: `Delete "${folder.name}"?`,
            content:
                "This folder will be deleted. Words inside it will not be deleted.",

            okText: "Delete",
            cancelText: "Cancel",

            okButtonProps: {
                danger: true,
            },

            onOk: () => {
                // Xóa folder khỏi danh sách folders
                setFolders((currentFolders) =>
                    currentFolders.filter(
                        (item) => item.id !== folder.id
                    )
                );

                // Xóa folder này khỏi các words
                // nhưng KHÔNG xóa word
                setWords((currentWords) =>
                    currentWords.map((word) => ({
                        ...word,
                        folders: word.folders.filter(
                            (folderId) =>
                                folderId !== folder.id
                        ),
                    }))
                );

                // Nếu đang filter bằng folder vừa xóa
                // thì quay về All Words
                if (selectedFolder === folder.id) {
                    setSelectedFolder("all");
                }

                messageApi.success(
                    `"${folder.name}" deleted successfully.`
                );
            },
        });
    };

    /* =====================================================
       RESET FILTERS
    ===================================================== */

    const resetFilters = () => {
        setSearch("");

        setSelectedFolder("all");

        setSortBy("newest");

        sessionStorage.setItem(
            FILTER_KEY,
            JSON.stringify({
                search: "",
                selectedFolder: "all",
                sortBy: "newest",
            })
        );
    };

    /* =====================================================
       FOLDER OPTIONS
    ===================================================== */

    const folderOptions =
        folders
            .filter(
                (folder) =>
                    folder.id !== "all"
            )
            .map((folder) => ({
                value: folder.id,
                label: folder.name,
            }));

    /* =====================================================
       DROPDOWN MENU
    ===================================================== */

    const getMenuItems = (word) => [
        {
            key: "view",
            icon: <BookOutlined />,
            label: "View details",

            onClick: ({ domEvent }) => {
                domEvent.stopPropagation();

                openWordDetail(word.word);
            },
        },

        {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit word",

            onClick: ({ domEvent }) => {
                domEvent.stopPropagation();

                openEditModal(word);
            },
        },

        {
            key: "move",
            icon: <FolderOutlined />,
            label: "Move to folder",

            onClick: ({ domEvent }) => {
                domEvent.stopPropagation();

                openMoveModal(word);
            },
        },

        {
            type: "divider",
        },

        {
            key: "delete",
            danger: true,
            icon: <DeleteOutlined />,
            label: "Remove from vocabulary",

            onClick: ({ domEvent }) => {
                domEvent.stopPropagation();

                Modal.confirm({
                    title: "Remove this word?",
                    content:
                        "This word will be removed from your vocabulary.",
                    okText: "Remove",
                    cancelText: "Cancel",
                    okButtonProps: {
                        danger: true,
                    },

                    onOk: () => {
                        removeWord(word.id);
                    },
                });
            },
        },
    ];

    /* =====================================================
       TABLE COLUMNS
    ===================================================== */

    const columns = [
        {
            title: "WORD",
            key: "word",
            width: 230,

            render: (_, word) => (
                <div className="word-cell">
                    <Tooltip title="Pronounce">
                        <Button
                            type="text"
                            shape="circle"
                            icon={
                                <SoundOutlined />
                            }
                            onClick={(e) => {
                                e.stopPropagation();

                                speakWord(
                                    word.word
                                );
                            }}
                        />
                    </Tooltip>

                    <div className="word-info">
                        <div className="word-title">
                            {word.word}
                        </div>

                        <div className="word-ipa">
                            {word.ipa}
                        </div>

                        <Text type="secondary">
                            {word.type}
                        </Text>
                    </div>
                </div>
            ),
        },

        {
            title: "MEANING",
            dataIndex: "meaning",
            key: "meaning",
            width: 200,

            render: (meaning) => (
                <Text>
                    {meaning}
                </Text>
            ),
        },

        {
            title: "EXAMPLE",
            key: "example",
            width: 380,

            render: (_, word) => (
                <div className="example-column">
                    <Text>
                        {word.example}
                    </Text>

                    <Text type="secondary">
                        {word.translation}
                    </Text>
                </div>
            ),
        },

        {
            title: "SAVED",
            dataIndex: "savedAt",
            key: "savedAt",
            width: 140,

            render: (date) => (
                <Text type="secondary">
                    {date}
                </Text>
            ),
        },

        {
            title: "",
            key: "actions",
            width: 70,
            align: "right",

            render: (_, word) => (
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
                >
                    <Button
                        type="text"
                        icon={
                            <MoreOutlined />
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    />
                </Dropdown>
            ),
        },
    ];

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            {contextHolder}

            <Navbar />

            <div className="vocabulary-page">
                <div className="vocabulary-container">

                    {/* HEADER */}

                    <div className="vocabulary-header">
                        <div>
                            <Text className="page-label">
                                YOUR COLLECTION
                            </Text>

                            <Title
                                level={1}
                                className="vocabulary-title"
                            >
                                Vocabulary
                            </Title>

                            <Paragraph
                                type="secondary"
                                className="vocabulary-description"
                            >
                                Build your personal
                                vocabulary and revisit
                                the words you've
                                discovered through
                                videos.
                            </Paragraph>
                        </div>
                    </div>

                    {/* TOOLBAR */}

                    <Card
                        className="vocabulary-toolbar"
                        styles={{
                            body: {
                                padding: 20,
                            },
                        }}
                    >
                        <div className="toolbar-content">

                            {/* SEARCH */}

                            <Input
                                allowClear
                                prefix={
                                    <SearchOutlined />
                                }
                                placeholder="Search words or meanings..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(
                                        e.target.value
                                    );
                                }}
                                className="search-input"
                            />

                            <Space
                                wrap
                                size={12}
                            >

                                {/* FOLDER FILTER */}

                                <Space size={8}>

                                    {selectedFolder !== "all" && (
                                        <Tooltip title="Delete selected folder">
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => {
                                                    const folder = folders.find(
                                                        (item) =>
                                                            item.id === selectedFolder
                                                    );

                                                    if (folder) {
                                                        deleteFolder(folder);
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    )}

                                    <Select
                                        value={selectedFolder}
                                        prefix={<FolderOutlined />}
                                        className="filter-select"
                                        onChange={(value) => {
                                            setSelectedFolder(value);
                                        }}
                                        options={[
                                            {
                                                value: "all",
                                                label: "All folders",
                                            },
                                            ...folderOptions,
                                        ]}
                                    />
                                </Space>

                                {/* NEW FOLDER */}

                                <Button
                                    icon={
                                        <PlusOutlined />
                                    }
                                    onClick={() => {
                                        setCreateFolderModalOpen(
                                            true
                                        );
                                    }}
                                >
                                    New folder
                                </Button>

                                {/* SORT */}

                                <Select
                                    value={sortBy}
                                    prefix={
                                        <SortAscendingOutlined />
                                    }
                                    className="filter-select"
                                    onChange={(
                                        value
                                    ) => {
                                        setSortBy(
                                            value
                                        );
                                    }}
                                    options={[
                                        {
                                            value:
                                                "newest",
                                            label:
                                                "Recently added",
                                        },
                                        {
                                            value:
                                                "oldest",
                                            label:
                                                "Oldest added",
                                        },
                                        {
                                            value:
                                                "alphabetical",
                                            label:
                                                "A → Z",
                                        },
                                        {
                                            value:
                                                "reverseAlphabetical",
                                            label:
                                                "Z → A",
                                        },
                                    ]}
                                />

                                {/* RESET */}

                                <Tooltip title="Reset filters">
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={resetFilters}
                                    />
                                </Tooltip>

                            </Space>
                        </div>
                    </Card>

                    {/* TABLE */}

                    <Card
                        className="vocabulary-table-card"
                        styles={{
                            body: {
                                padding: 0,
                            },
                        }}
                    >
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={
                                filteredWords
                            }
                            scroll={{
                                x: 1020,
                            }}
                            pagination={false}
                            onRow={(word) => ({
                                onClick: () => {
                                    openWordDetail(
                                        word.word
                                    );
                                },
                            })}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={
                                            Empty.PRESENTED_IMAGE_SIMPLE
                                        }
                                        description={
                                            <div>
                                                <div>
                                                    No words found
                                                </div>

                                                <Button
                                                    type="link"
                                                    onClick={(
                                                        e
                                                    ) => {
                                                        e.stopPropagation();

                                                        resetFilters();
                                                    }}
                                                >
                                                    Clear filters
                                                </Button>
                                            </div>
                                        }
                                    />
                                ),
                            }}
                        />
                    </Card>

                </div>
            </div>

            {/* =================================================
               EDIT WORD MODAL
            ================================================= */}

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

            {/* =================================================
               MOVE TO FOLDER MODAL
            ================================================= */}

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
                    options={folderOptions}
                />

                <Button
                    type="link"
                    icon={<PlusOutlined />}
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

        </>
    );
}

export default Vocabulary;