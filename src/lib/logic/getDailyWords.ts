import { Word, QuizWord } from "@/types";

const REVIEW_INTERVALS_DAYS = [1, 3, 7];
const REVIEW_RATIO = 0.2;
const SESSION_SIZE = 10;

export function getDailyWords(
  allWords: Word[],
  studiedVocabIds: number[],
  reviewCandidateIds: number[],
  weakVocabIds: number[]
): QuizWord[] {
  const studiedSet = new Set(studiedVocabIds);
  const weakSet = new Set(weakVocabIds);

  const newWords = allWords.filter((w) => !studiedSet.has(w.id));
  const reviewWords = allWords.filter((w) => reviewCandidateIds.includes(w.id));

  const reviewCount = Math.floor(SESSION_SIZE * REVIEW_RATIO);
  const newCount = SESSION_SIZE - reviewCount;

  const selectedReview = shuffle(reviewWords).slice(0, reviewCount);
  // 復習単語が不足する場合は新規単語で補完してSESSION_SIZEを維持する
  const fillCount = newCount + (reviewCount - selectedReview.length);
  const selectedNew = shuffle(newWords).slice(0, fillCount);

  const combined = shuffle([...selectedNew, ...selectedReview]);

  return combined.map((w) => ({
    ...w,
    is_weak: weakSet.has(w.id),
    is_review: reviewCandidateIds.includes(w.id),
  }));
}

export function getReviewCandidateIds(
  studyLogs: { vocabulary_id: number; created_at: string }[]
): number[] {
  const now = new Date();
  const candidates = new Set<number>();

  for (const log of studyLogs) {
    const logDate = new Date(log.created_at);
    const diffDays = Math.floor(
      (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (REVIEW_INTERVALS_DAYS.includes(diffDays)) {
      candidates.add(log.vocabulary_id);
    }
  }

  return Array.from(candidates);
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
