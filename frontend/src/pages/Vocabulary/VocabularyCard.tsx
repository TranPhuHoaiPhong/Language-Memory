import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Word } from '../../data/vocabularyData';

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

    const statusColor = {
        Learning: '#f59e0b',
        Review: '#3b82f6',
        Mastered: '#10b981',
    };

    const handleView = () => {
        navigate(`/detail`);
    };

    return (
        <div className="vocab-card">
            <div className="card-header">
                <div className="word-section">
                    <h3 className="word">{word.word}</h3>
                    <span className="ipa">{word.ipa}</span>
                    <span className="part-of-speech">{word.partOfSpeech}</span>
                </div>
                <button
                    className={`favorite-btn ${word.favorite ? 'active' : ''}`}
                    onClick={() => onToggleFavorite(word.id)}
                    aria-label={word.favorite ? 'Unfavorite' : 'Favorite'}
                >
                    {word.favorite ? '❤️' : '🤍'}
                </button>
            </div>

            <div className="meaning-section">
                <p className="meaning">{word.meaning}</p>
                <blockquote className="example">
                    "{word.example}"
                    <cite>{word.translation}</cite>
                </blockquote>
            </div>

            <div className="meta-section">
                <div className="video-source">
                    <span>📺 {word.videoTitle}</span>
                    <span className="timestamp">
                        {Math.floor(word.timestamp / 60)}:
                        {String(word.timestamp % 60).padStart(2, '0')}
                    </span>
                </div>
                <div className="badge-group">
                    <span className="level-badge">{word.level}</span>
                    <span
                        className="status-badge"
                        style={{ backgroundColor: statusColor[word.status] + '20', color: statusColor[word.status] }}
                    >
                        {word.status}
                    </span>
                </div>
                <div className="added-date">Added {word.addedAt}</div>
            </div>

            <div className="card-actions">
                <button className="action-btn review" onClick={() => onReview(word.id)}>
                    🔄 Review
                </button>
                <button className="action-btn view" onClick={handleView}>
                    👁️ View
                </button>
                <div className="more-menu">
                    <button className="action-btn more">⋯</button>
                    <div className="dropdown-menu">
                        <button onClick={() => onMarkMastered(word.id)}>Mark as Mastered</button>
                        <button onClick={() => onDelete(word.id)}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VocabularyCard;