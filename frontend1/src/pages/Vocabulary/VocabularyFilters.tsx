import React from 'react';
import { Input, Select, Row, Col, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface FiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    levelFilter: string;
    setLevelFilter: (level: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
}

const { Option } = Select;

const STATUS_OPTIONS = ['All', 'Learning', 'Review', 'Mastered'];
const LEVEL_OPTIONS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SORT_OPTIONS = [
    { value: 'recent', label: 'Recently Added' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'oldest', label: 'Oldest' },
];

const VocabularyFilters: React.FC<FiltersProps> = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    levelFilter,
    setLevelFilter,
    sortBy,
    setSortBy,
}) => {
    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
                <Input
                    placeholder="Search vocabulary..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    prefix={<SearchOutlined />}
                    allowClear
                />
            </Col>
            <Col xs={12} md={5}>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Status"
                    value={statusFilter || undefined}
                    onChange={(value) => setStatusFilter(value || '')}
                    allowClear
                >
                    {STATUS_OPTIONS.map(status => (
                        <Option key={status} value={status === 'All' ? '' : status}>
                            {status}
                        </Option>
                    ))}
                </Select>
            </Col>
            <Col xs={12} md={5}>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Level"
                    value={levelFilter || undefined}
                    onChange={(value) => setLevelFilter(value || '')}
                    allowClear
                >
                    {LEVEL_OPTIONS.map(level => (
                        <Option key={level} value={level === 'All' ? '' : level}>
                            {level}
                        </Option>
                    ))}
                </Select>
            </Col>
            <Col xs={24} md={6}>
                <Select
                    style={{ width: '100%' }}
                    value={sortBy}
                    onChange={(value) => setSortBy(value)}
                >
                    {SORT_OPTIONS.map(option => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Col>
        </Row>
    );
};

export default VocabularyFilters;