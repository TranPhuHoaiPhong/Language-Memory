import React from 'react';
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
        { label: 'Total Words', value: total },
        { label: 'Learning', value: learning },
        { label: 'Mastered', value: mastered },
        { label: 'Added This Week', value: addedThisWeek },
    ];

    return (
        <div className="stats-grid">
            {stats.map(stat => (
                <div className="stat-card" key={stat.label}>
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-value">{stat.value}</span>
                </div>
            ))}
        </div>
    );
};

export default VocabularyStats;