import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Dropdown, Menu, Space, Typography, Tooltip } from 'antd';
import {
    HeartOutlined,
    HeartFilled,
    EyeOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    MoreOutlined,
    SoundOutlined,
} from '@ant-design/icons';
import type { Word } from '../../data/types';

const { Text, Paragraph } = Typography;

interface CardProps {
    word: Word;
    onToggleFavorite: (id: number) => void;
    onReview: (id: number) => void;
    onDelete: (id: number) => void;
    onMarkMastered: (id: number) => void;
}

const VocabularyCard: React.FC<CardProps> = ({
    word,
    onToggleFavorite,
    onReview,
    onDelete,
    onMarkMastered,
}) => {
    const navigate = useNavigate();

    const statusColorMap = {
        Learning: 'gold',
        Review: 'blue',
        Mastered: 'green',
    } as const;

    const levelColorMap = {
        A1: 'default',
        A2: 'default',
        B1: 'cyan',
        B2: 'cyan',
        C1: 'geekblue',
        C2: 'geekblue',
    } as const;

    const handleView = () => {
        navigate(`/detail/${word.id}`);
    };

    const menu = (
        <Menu>
            <Menu.Item key="mastered" icon={<CheckCircleOutlined />} onClick={() => onMarkMastered(word.id)}>
                Mark as Mastered
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDelete(word.id)}>
                Delete
            </Menu.Item>
        </Menu>
    );

    return (
        <Card
            hoverable
            actions={[
                <Tooltip title="Review" key="review">
                    <Button type="text" icon={<SoundOutlined />} onClick={() => onReview(word.id)} />
                </Tooltip>,
                <Tooltip title="View" key="view">
                    <Button type="text" icon={<EyeOutlined />} onClick={handleView} />
                </Tooltip>,
                <Dropdown overlay={menu} placement="bottomRight" key="more">
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>,
            ]}
            cover={
                <div style={{ padding: '16px 16px 0' }}>
                    <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space direction="vertical" size={2}>
                            <Text strong style={{ fontSize: 18 }}>{word.word}</Text>
                            <Text type="secondary">{word.ipa}</Text>
                            <Text type="secondary">{word.partOfSpeech}</Text>
                        </Space>
                        <Button
                            type="text"
                            icon={word.favorite ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                            onClick={() => onToggleFavorite(word.id)}
                        />
                    </Space>
                </div>
            }
        >
            <div style={{ marginBottom: 12 }}>
                <Paragraph strong>{word.meaning}</Paragraph>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                    "{word.example}"
                </Paragraph>
                <Text type="secondary">- {word.translation}</Text>
            </div>

            <div style={{ marginBottom: 8 }}>
                <Space size={[0, 4]} wrap>
                    <Tag color={levelColorMap[word.level as keyof typeof levelColorMap] || 'default'}>
                        {word.level}
                    </Tag>
                    <Tag color={statusColorMap[word.status as keyof typeof statusColorMap]}>
                        {word.status}
                    </Tag>
                </Space>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    📺 {word.videoTitle}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {Math.floor(word.timestamp / 60)}:
                    {String(word.timestamp % 60).padStart(2, '0')}
                </Text>
            </div>
            <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Added {word.addedAt}</Text>
            </div>
        </Card>
    );
};

export default VocabularyCard;