export type Word = {
  id: number;
  word: string;
  pos: string;
  meaning: string;
  level: 1 | 2 | 3;
  example_scene: string;
  similar: string;
};

export type QuizWord = Word & {
  is_weak: boolean;
  is_review: boolean;
};

export type StudyResult = {
  vocabulary_id: number;
  is_correct: boolean;
  response_time: number;
};

export type StudyResultResponse = {
  is_newly_mastered: boolean;
  is_newly_overcome: boolean;
};

export type DailyStat = {
  study_date: string;
  study_time: number;
  correct_rate: number;
  word_count: number;
};

export type WeakWord = {
  vocabulary_id: number;
  word: string;
  meaning: string;
  mistake_count: number;
};

export type MasteredWordsResponse = {
  total: number;
  by_level: {
    1: { mastered: number; total: number };
    2: { mastered: number; total: number };
    3: { mastered: number; total: number };
  };
};

export type WeeklyStat = {
  week: string;
  mastered_count: number;
  weak_count: number;
  correct_count: number;
};

export type LevelProgress = {
  level: 1 | 2 | 3;
  mastered: number;
  total: number;
};

export type AICommentRequest = {
  streak_days: number;
  correct_rate: number;
  word_count: number;
  weak_word_count: number;
  newly_mastered: number;
};
