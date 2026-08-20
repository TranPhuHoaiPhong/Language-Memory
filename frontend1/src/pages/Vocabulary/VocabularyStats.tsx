import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import {
    BookOutlined,
    FireOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import type { Word } from '../../data/vocabularyData';

interface StatsProps {
    words: Word[];
}

const VocabularyStats: React.FC<StatsProps> = ({ words }) => {
    const total = words.length;
    const learning = words.filter(w => w.status === 'Learning').length;
    const mastered = words.filter(w => w.status === 'Mastered').length;
    const addedThisWeek = words.filter(w => {
        const added = new Date(w.addedAt);
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return added >= weekAgo;
    }).length;

    const stats = [
        { label: 'Total Words', value: total, icon: <BookOutlined />, color: '#1890ff' },
        { label: 'Learning', value: learning, icon: <FireOutlined />, color: '#faad14' },
        { label: 'Mastered', value: mastered, icon: <CheckCircleOutlined />, color: '#52c41a' },
        { label: 'Added This Week', value: addedThisWeek, icon: <CalendarOutlined />, color: '#722ed1' },
    ];

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {stats.map(stat => (
                <Col xs={12} sm={6} key={stat.label}>
                    <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title={stat.label}
                            value={stat.value}
                            prefix={stat.icon}
                            valueStyle={{ color: stat.color }}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default VocabularyStats;