import React from 'react';

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
        <div className="filters-container">
            <div className="search-wrapper">
                <input
                    type="text"
                    placeholder="Search vocabulary..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="filter-group">
                <div className="filter-item">
                    <label>Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status === 'All' ? '' : status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <label>Level</label>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="filter-select"
                    >
                        {LEVEL_OPTIONS.map(level => (
                            <option key={level} value={level === 'All' ? '' : level}>
                                {level}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <label>Sort</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="filter-select"
                    >
                        {SORT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default VocabularyFilters;