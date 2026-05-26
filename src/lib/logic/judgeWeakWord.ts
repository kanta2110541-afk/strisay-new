const MISTAKE_THRESHOLD = 2;
const RESPONSE_TIME_THRESHOLD_MS = 8000;

export type WeakWordRecord = {
  vocabulary_id: number;
  mistake_count: number;
  avg_response_time: number;
  is_overcome: boolean;
};

export function judgeWeakWord(
  existing: WeakWordRecord | null,
  is_correct: boolean,
  response_time: number
): { should_register: boolean; new_mistake_count: number; new_avg_time: number } {
  const currentCount = existing?.mistake_count ?? 0;
  const isSlowResponse = response_time > RESPONSE_TIME_THRESHOLD_MS;

  if (!is_correct || isSlowResponse) {
    const newCount = is_correct ? currentCount : currentCount + 1;
    const prevAvg = existing?.avg_response_time ?? 0;
    const prevCount = currentCount;
    const newAvg =
      prevCount === 0
        ? response_time
        : Math.floor((prevAvg * prevCount + response_time) / (prevCount + 1));

    return {
      should_register: newCount >= MISTAKE_THRESHOLD || isSlowResponse,
      new_mistake_count: newCount,
      new_avg_time: newAvg,
    };
  }

  return {
    should_register: false,
    new_mistake_count: currentCount,
    new_avg_time: existing?.avg_response_time ?? 0,
  };
}
