export type Word = {
    id: number;
    word: string;
    ipa: string;
    meaning: string;
    partOfSpeech: string;
    example: string;
    translation: string;
    videoTitle: string;
    videoId: string;
    timestamp: number;
    addedAt: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    status: 'Learning' | 'Review' | 'Mastered';
    favorite: boolean;
};