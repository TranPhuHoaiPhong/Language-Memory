import React, { useState, useMemo } from "react";
import { Row, Col, Typography, Empty, Button, Space } from "antd";
import {
    SearchOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import "./Vocabulary.css"; // vẫn giữ CSS nếu cần, nhưng sẽ dùng ít hơn

import { vocabularyData } from "../../data/vocabularyData";
import type { Word } from "../../data/types";

import VocabularyStats from "./VocabularyStats";
import VocabularyFilters from "./VocabularyFilters";
import VocabularyCard from "./VocabularyCard";

const { Title, Text } = Typography;

const Vocabulary: React.FC = () => {
    const [words, setWords] = useState<Word[]>(vocabularyData);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [sortBy, setSortBy] = useState("recent");

    const filteredWords = useMemo(() => {
        let result = [...words];
        // ... (logic unchanged)
        return result;
    }, [words, searchTerm, statusFilter, levelFilter, sortBy]);

    // handlers (toggleFavorite, reviewWord, deleteWord, markMastered) unchanged

    return (
        <div className="vocabulary-page">
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>Vocabulary</Title>
                    <Text type="secondary">Review and manage the words you've learned from real-world content.</Text>
                </Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />}>Add Word</Button>
                </Col>
            </Row>

            <VocabularyStats words={words} />

            <VocabularyFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                levelFilter={levelFilter}
                setLevelFilter={setLevelFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />

            {filteredWords.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            No vocabulary yet. <br />
                            Words you save while watching videos will appear here.
                        </span>
                    }
                >
                    <Button type="primary">Start Watching</Button>
                </Empty>
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredWords.map((word) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={word.id}>
                            <VocabularyCard
                                word={word}
                                onToggleFavorite={toggleFavorite}
                                onReview={reviewWord}
                                onDelete={deleteWord}
                                onMarkMastered={markMastered}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default Vocabulary;