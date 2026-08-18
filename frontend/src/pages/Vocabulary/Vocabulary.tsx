import React, { useState, useMemo } from "react";
import "./Vocabulary.css";

import { vocabularyData } from "../../data/vocabularyData";
import type { Word } from "../../data/types";

import VocabularyStats from "./VocabularyStats";
import VocabularyFilters from "./VocabularyFilters";
import VocabularyCard from "./VocabularyCard";

const Vocabulary: React.FC = () => {
    const [words, setWords] = useState<Word[]>(
        vocabularyData
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [sortBy, setSortBy] = useState("recent");

    const filteredWords = useMemo(() => {
        let result = [...words];

        // =========================
        // SEARCH
        // =========================

        if (searchTerm.trim()) {
            const term = searchTerm
                .trim()
                .toLowerCase();

            result = result.filter(
                (word) =>
                    word.word
                        .toLowerCase()
                        .includes(term) ||
                    word.meaning
                        .toLowerCase()
                        .includes(term) ||
                    word.example
                        .toLowerCase()
                        .includes(term)
            );
        }

        // =========================
        // STATUS FILTER
        // =========================

        if (statusFilter) {
            result = result.filter(
                (word) =>
                    word.status === statusFilter
            );
        }

        // =========================
        // LEVEL FILTER
        // =========================

        if (levelFilter) {
            result = result.filter(
                (word) =>
                    word.level === levelFilter
            );
        }

        // =========================
        // SORT
        // =========================

        switch (sortBy) {
            case "alphabetical":
                result.sort((a, b) =>
                    a.word.localeCompare(b.word)
                );
                break;

            case "oldest":
                result.sort(
                    (a, b) =>
                        new Date(
                            a.addedAt
                        ).getTime() -
                        new Date(
                            b.addedAt
                        ).getTime()
                );
                break;

            case "recent":
            default:
                result.sort(
                    (a, b) =>
                        new Date(
                            b.addedAt
                        ).getTime() -
                        new Date(
                            a.addedAt
                        ).getTime()
                );
                break;
        }

        return result;
    }, [
        words,
        searchTerm,
        statusFilter,
        levelFilter,
        sortBy,
    ]);

    // =========================
    // FAVORITE
    // =========================

    const toggleFavorite = (id: number) => {
        setWords((prev) =>
            prev.map((word) =>
                word.id === id
                    ? {
                        ...word,
                        favorite:
                            !word.favorite,
                    }
                    : word
            )
        );
    };

    // =========================
    // REVIEW
    // =========================

    const reviewWord = (id: number) => {
        alert(
            `Đưa từ ID ${id} vào ôn tập.`
        );
    };

    // =========================
    // DELETE
    // =========================

    const deleteWord = (id: number) => {
        if (
            window.confirm(
                "Bạn có chắc muốn xóa từ này?"
            )
        ) {
            setWords((prev) =>
                prev.filter(
                    (word) =>
                        word.id !== id
                )
            );
        }
    };

    // =========================
    // MARK MASTERED
    // =========================

    const markMastered = (id: number) => {
        setWords((prev) =>
            prev.map((word) =>
                word.id === id
                    ? {
                        ...word,
                        status: "Mastered",
                    }
                    : word
            )
        );
    };

    return (
        <div className="vocabulary-page">

            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}

            <header className="page-header">
                <div>
                    <h1>Vocabulary</h1>

                    <p className="subtitle">
                        Review and manage the words
                        you've learned from
                        real-world content.
                    </p>
                </div>
            </header>

            {/* ========================= */}
            {/* STATS */}
            {/* ========================= */}

            <VocabularyStats
                words={words}
            />

            {/* ========================= */}
            {/* FILTERS */}
            {/* ========================= */}

            <VocabularyFilters
                searchTerm={searchTerm}
                setSearchTerm={
                    setSearchTerm
                }
                statusFilter={
                    statusFilter
                }
                setStatusFilter={
                    setStatusFilter
                }
                levelFilter={
                    levelFilter
                }
                setLevelFilter={
                    setLevelFilter
                }
                sortBy={sortBy}
                setSortBy={setSortBy}
            />

            {/* ========================= */}
            {/* VOCABULARY */}
            {/* ========================= */}

            {filteredWords.length === 0 ? (
                <div className="empty-state">

                    <h2>
                        No vocabulary yet
                    </h2>

                    <p>
                        Words you save while
                        watching videos will
                        appear here.
                    </p>

                    <button className="primary-btn">
                        Start Watching
                    </button>

                </div>
            ) : (
                <div className="card-grid">

                    {filteredWords.map(
                        (word) => (
                            <VocabularyCard
                                key={word.id}
                                word={word}
                                onToggleFavorite={
                                    toggleFavorite
                                }
                                onReview={
                                    reviewWord
                                }
                                onDelete={
                                    deleteWord
                                }
                                onMarkMastered={
                                    markMastered
                                }
                            />
                        )
                    )}

                </div>
            )}
        </div>
    );
};

export default Vocabulary;