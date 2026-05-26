const MASTERED_CONSECUTIVE = 3;

export type ProgressRecord = {
  consecutive_correct: number;
  is_mastered: boolean;
};

export function judgeMastered(
  existing: ProgressRecord | null,
  is_correct: boolean
): { consecutive_correct: number; is_mastered: boolean; is_newly_mastered: boolean } {
  const prev = existing ?? { consecutive_correct: 0, is_mastered: false };

  if (!is_correct) {
    return { consecutive_correct: 0, is_mastered: false, is_newly_mastered: false };
  }

  const newConsecutive = prev.consecutive_correct + 1;
  const isMastered = newConsecutive >= MASTERED_CONSECUTIVE;
  const isNewlyMastered = isMastered && !prev.is_mastered;

  return {
    consecutive_correct: newConsecutive,
    is_mastered: isMastered,
    is_newly_mastered: isNewlyMastered,
  };
}
