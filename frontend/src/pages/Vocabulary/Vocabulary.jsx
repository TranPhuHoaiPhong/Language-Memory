import { useMemo, useState } from "react";
import {
    SearchOutlined,
    SoundOutlined,
    StarFilled,
    StarOutlined,
    MoreOutlined,
    FilterOutlined,
    BookOutlined,
    CheckCircleFilled,
    ClockCircleFilled,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { Dropdown, Modal, Pagination, Tag } from "antd";

import "./Vocabulary.css";

const vocabularyData = [
    {
        id: 1,
        word: "actually",
        ipa: "/ˈæk.tʃu.ə.li/",
        meaning: "thực sự, thực tế là",
        example: "I actually don't know what happened.",
        translation: "Thực sự tôi không biết chuyện gì đã xảy ra.",
        type: "Adverb",
        level: "B1",
        status: "Mastered",
        favorite: true,
        source: "Building Better Habits",
        date: "Aug 20, 2026",
    },
    {
        id: 2,
        word: "habit",
        ipa: "/ˈhæb.ɪt/",
        meaning: "thói quen",
        example: "Reading is a good habit.",
        translation: "Đọc sách là một thói quen tốt.",
        type: "Noun",
        level: "A2",
        status: "Learning",
        favorite: true,
        source: "Building Better Habits",
        date: "Aug 20, 2026",
    },
    {
        id: 3,
        word: "stimulation",
        ipa: "/ˌstɪm.jəˈleɪ.ʃən/",
        meaning: "sự kích thích",
        example: "The brain needs constant stimulation.",
        translation: "Bộ não cần sự kích thích liên tục.",
        type: "Noun",
        level: "C1",
        status: "Learning",
        favorite: false,
        source: "Building Better Habits",
        date: "Aug 19, 2026",
    },
    {
        id: 4,
        word: "discipline",
        ipa: "/ˈdɪs.ə.plɪn/",
        meaning: "kỷ luật",
        example: "Success requires discipline.",
        translation: "Thành công đòi hỏi tính kỷ luật.",
        type: "Noun",
        level: "B2",
        status: "New",
        favorite: false,
        source: "Building Better Habits",
        date: "Aug 19, 2026",
    },
    {
        id: 5,
        word: "procrastinate",
        ipa: "/prəʊˈkræs.tɪ.neɪt/",
        meaning: "trì hoãn",
        example: "I often procrastinate when I feel tired.",
        translation: "Tôi thường trì hoãn khi cảm thấy mệt.",
        type: "Verb",
        level: "B2",
        status: "Learning",
        favorite: false,
        source: "Productivity",
        date: "Aug 18, 2026",
    },
    {
        id: 6,
        word: "productive",
        ipa: "/prəˈdʌk.tɪv/",
        meaning: "hiệu quả, năng suất",
        example: "I had a very productive day.",
        translation: "Tôi đã có một ngày rất hiệu quả.",
        type: "Adjective",
        level: "B1",
        status: "Mastered",
        favorite: true,
        source: "Productivity",
        date: "Aug 18, 2026",
    },
    {
        id: 7,
        word: "environment",
        ipa: "/ɪnˈvaɪ.rən.mənt/",
        meaning: "môi trường",
        example: "Your environment affects your behavior.",
        translation: "Môi trường ảnh hưởng đến hành vi của bạn.",
        type: "Noun",
        level: "B1",
        status: "New",
        favorite: false,
        source: "Daily English",
        date: "Aug 17, 2026",
    },
    {
        id: 8,
        word: "consistent",
        ipa: "/kənˈsɪs.tənt/",
        meaning: "nhất quán, đều đặn",
        example: "You need to be consistent.",
        translation: "Bạn cần phải duy trì đều đặn.",
        type: "Adjective",
        level: "B2",
        status: "Learning",
        favorite: false,
        source: "Daily English",
        date: "Aug 17, 2026",
    },
];

function Vocabulary() {
    const [words, setWords] = useState(vocabularyData);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [levelFilter, setLevelFilter] = useState("All");
    const [selectedWord, setSelectedWord] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 6;

    const filteredWords = useMemo(() => {
        return words.filter((word) => {
            const matchesSearch =
                word.word.toLowerCase().includes(search.toLowerCase()) ||
                word.meaning.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "All" || word.status === statusFilter;

            const matchesLevel =
                levelFilter === "All" || word.level === levelFilter;

            return matchesSearch && matchesStatus && matchesLevel;
        });
    }, [words, search, statusFilter, levelFilter]);

    const displayedWords = filteredWords.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const masteredCount = words.filter(
        (word) => word.status === "Mastered"
    ).length;

    const learningCount = words.filter(
        (word) => word.status === "Learning"
    ).length;

    const newCount = words.filter(
        (word) => word.status === "New"
    ).length;

    const favoriteCount = words.filter(
        (word) => word.favorite
    ).length;

    const toggleFavorite = (id) => {
        setWords((currentWords) =>
            currentWords.map((word) =>
                word.id === id
                    ? { ...word, favorite: !word.favorite }
                    : word
            )
        );
    };

    const deleteWord = (id) => {
        setWords((currentWords) =>
            currentWords.filter((word) => word.id !== id)
        );
    };

    const speakWord = (word) => {
        if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = "en-US";
            utterance.rate = 0.8;

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    };

    const menuItems = (word) => [
        {
            key: "view",
            icon: <BookOutlined />,
            label: "View details",
            onClick: () => setSelectedWord(word),
        },
        {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit word",
        },
        {
            key: "delete",
            danger: true,
            icon: <DeleteOutlined />,
            label: "Delete",
            onClick: () => deleteWord(word.id),
        },
    ];

    const getStatusClass = (status) => {
        if (status === "Mastered") return "mastered";
        if (status === "Learning") return "learning";
        return "new";
    };

    return (
        <div className="vocabulary-page">
            <div className="vocabulary-container">

                {/* ================= HEADER ================= */}

                <div className="vocabulary-header">
                    <div>
                        <div className="page-label">
                            YOUR COLLECTION
                        </div>

                        <h1>Vocabulary</h1>

                        <p>
                            Build your personal English vocabulary and
                            review the words you've discovered.
                        </p>
                    </div>

                    <button className="review-button">
                        <BookOutlined />
                        Review words
                    </button>
                </div>

                {/* ================= STATS ================= */}

                <div className="vocabulary-stats">

                    <div className="vocabulary-stat-card">
                        <div className="stat-icon total">
                            <BookOutlined />
                        </div>

                        <div>
                            <span>Total words</span>
                            <strong>{words.length}</strong>
                        </div>
                    </div>

                    <div className="vocabulary-stat-card">
                        <div className="stat-icon mastered">
                            <CheckCircleFilled />
                        </div>

                        <div>
                            <span>Mastered</span>
                            <strong>{masteredCount}</strong>
                        </div>
                    </div>

                    <div className="vocabulary-stat-card">
                        <div className="stat-icon learning">
                            <ClockCircleFilled />
                        </div>

                        <div>
                            <span>Learning</span>
                            <strong>{learningCount}</strong>
                        </div>
                    </div>

                    <div className="vocabulary-stat-card">
                        <div className="stat-icon favorite">
                            <StarFilled />
                        </div>

                        <div>
                            <span>Favorites</span>
                            <strong>{favoriteCount}</strong>
                        </div>
                    </div>

                </div>

                {/* ================= TOOLBAR ================= */}

                <div className="vocabulary-toolbar">

                    <div className="search-box">
                        <SearchOutlined />

                        <input
                            type="text"
                            placeholder="Search words or meanings..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="filter-group">

                        <div className="filter-select">
                            <FilterOutlined />

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">
                                    All status
                                </option>
                                <option value="New">
                                    New
                                </option>
                                <option value="Learning">
                                    Learning
                                </option>
                                <option value="Mastered">
                                    Mastered
                                </option>
                            </select>
                        </div>

                        <div className="filter-select">
                            <select
                                value={levelFilter}
                                onChange={(e) => {
                                    setLevelFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="All">
                                    All levels
                                </option>
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                                <option value="C2">C2</option>
                            </select>
                        </div>

                    </div>
                </div>

                {/* ================= LIST HEADER ================= */}

                <div className="vocabulary-list">

                    <div className="vocabulary-list-header">
                        <span>WORD</span>
                        <span>MEANING</span>
                        <span>EXAMPLE</span>
                        <span>LEVEL</span>
                        <span>STATUS</span>
                        <span></span>
                    </div>

                    {/* ================= WORDS ================= */}

                    {displayedWords.length > 0 ? (
                        displayedWords.map((word) => (
                            <div
                                className="vocabulary-row"
                                key={word.id}
                            >
                                {/* WORD */}

                                <div className="word-cell">

                                    <div className="word-main">
                                        <button
                                            className="sound-button"
                                            onClick={() =>
                                                speakWord(word.word)
                                            }
                                            title="Pronounce"
                                        >
                                            <SoundOutlined />
                                        </button>

                                        <div>
                                            <strong>{word.word}</strong>

                                            <span className="ipa">
                                                {word.ipa}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="word-type">
                                        {word.type}
                                    </span>

                                </div>

                                {/* MEANING */}

                                <div className="meaning-cell">
                                    {word.meaning}
                                </div>

                                {/* EXAMPLE */}

                                <div className="example-cell">
                                    <span>
                                        {word.example}
                                    </span>

                                    <small>
                                        {word.translation}
                                    </small>
                                </div>

                                {/* LEVEL */}

                                <div>
                                    <span
                                        className={`level-badge level-${word.level.toLowerCase()}`}
                                    >
                                        {word.level}
                                    </span>
                                </div>

                                {/* STATUS */}

                                <div>
                                    <span
                                        className={`status-badge ${getStatusClass(
                                            word.status
                                        )}`}
                                    >
                                        {word.status}
                                    </span>
                                </div>

                                {/* ACTIONS */}

                                <div className="row-actions">

                                    <button
                                        className="favorite-button"
                                        onClick={() =>
                                            toggleFavorite(word.id)
                                        }
                                    >
                                        {word.favorite ? (
                                            <StarFilled />
                                        ) : (
                                            <StarOutlined />
                                        )}
                                    </button>

                                    <Dropdown
                                        menu={{
                                            items: menuItems(word),
                                        }}
                                        trigger={["click"]}
                                    >
                                        <button className="more-button">
                                            <MoreOutlined />
                                        </button>
                                    </Dropdown>

                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <BookOutlined />

                            <h3>No words found</h3>

                            <p>
                                Try changing your search or filters.
                            </p>
                        </div>
                    )}

                </div>

                {/* ================= FOOTER ================= */}

                {filteredWords.length > 0 && (
                    <div className="vocabulary-footer">

                        <span>
                            Showing{" "}
                            <strong>
                                {(currentPage - 1) * pageSize + 1}
                            </strong>{" "}
                            –{" "}
                            <strong>
                                {Math.min(
                                    currentPage * pageSize,
                                    filteredWords.length
                                )}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {filteredWords.length}
                            </strong>{" "}
                            words
                        </span>

                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredWords.length}
                            onChange={(page) =>
                                setCurrentPage(page)
                            }
                            showSizeChanger={false}
                        />

                    </div>
                )}

            </div>

            {/* ================= DETAIL MODAL ================= */}

            <Modal
                open={Boolean(selectedWord)}
                onCancel={() => setSelectedWord(null)}
                footer={null}
                centered
                width={560}
            >
                {selectedWord && (
                    <div className="word-detail">

                        <div className="detail-top">
                            <div>
                                <span className="detail-type">
                                    {selectedWord.type}
                                </span>

                                <h2>{selectedWord.word}</h2>

                                <span className="detail-ipa">
                                    {selectedWord.ipa}
                                </span>
                            </div>

                            <button
                                className="detail-sound"
                                onClick={() =>
                                    speakWord(selectedWord.word)
                                }
                            >
                                <SoundOutlined />
                            </button>
                        </div>

                        <div className="detail-meaning">
                            <span>Meaning</span>

                            <strong>
                                {selectedWord.meaning}
                            </strong>
                        </div>

                        <div className="detail-example">
                            <span>Example</span>

                            <p>
                                “{selectedWord.example}”
                            </p>

                            <small>
                                {selectedWord.translation}
                            </small>
                        </div>

                        <div className="detail-meta">

                            <div>
                                <span>Level</span>

                                <Tag>
                                    {selectedWord.level}
                                </Tag>
                            </div>

                            <div>
                                <span>Status</span>

                                <Tag>
                                    {selectedWord.status}
                                </Tag>
                            </div>

                            <div>
                                <span>Source</span>

                                <strong>
                                    {selectedWord.source}
                                </strong>
                            </div>

                        </div>

                    </div>
                )}
            </Modal>
        </div>
    );
}

export default Vocabulary;