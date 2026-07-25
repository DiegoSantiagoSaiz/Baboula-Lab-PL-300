import type { ProgressData, QuestionCategory } from '../types';

const MIN_QUESTIONS_FOR_CATEGORY = 3;
const RECENT_SESSIONS_COUNT = 3;

export const calculateReadinessScore = (progressData: ProgressData): number => {
    // 1. Overall Accuracy (40% weight)
    const overallAccuracy = progressData.totalQuestions > 0 
        ? (progressData.totalCorrect / progressData.totalQuestions) * 100 
        : 0;

    // 2. Weakest Category Performance (30% weight)
    let weakestCategoryScore = -1;
    const qualifiedCategories = (Object.keys(progressData.categoryStats) as QuestionCategory[]).filter(
        key => progressData.categoryStats[key].total >= MIN_QUESTIONS_FOR_CATEGORY
    );

    if (qualifiedCategories.length > 0) {
        weakestCategoryScore = Math.min(
            ...qualifiedCategories.map(key => {
                const stats = progressData.categoryStats[key];
                return (stats.correct / stats.total) * 100;
            })
        );
    } else {
        // Fallback if no category has enough data
        weakestCategoryScore = overallAccuracy;
    }

    // 3. Recent Trend (30% weight)
    let recentTrendScore = 0;
    const history = progressData.accuracyHistory || [];
    if (history.length > 0) {
        const recentSessions = history.slice(-RECENT_SESSIONS_COUNT);
        const sum = recentSessions.reduce((acc, session) => acc + session.accuracy, 0);
        recentTrendScore = sum / recentSessions.length;
    } else {
        // Fallback if no history
        recentTrendScore = overallAccuracy;
    }
    
    // Final weighted score
    const readinessScore = (overallAccuracy * 0.4) + (weakestCategoryScore * 0.3) + (recentTrendScore * 0.3);

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(readinessScore)));
};
