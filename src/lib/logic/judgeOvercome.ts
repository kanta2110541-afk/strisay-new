const OVERCOME_CONSECUTIVE = 2;

export type OvercomeContext = {
  is_weak: boolean;
  consecutive_correct: number;
  is_overcome: boolean;
};

export function judgeOvercome(
  context: OvercomeContext,
  is_correct: boolean
): { is_newly_overcome: boolean; should_re_register: boolean } {
  if (!context.is_weak) {
    return { is_newly_overcome: false, should_re_register: false };
  }

  if (!is_correct) {
    return { is_newly_overcome: false, should_re_register: context.is_overcome };
  }

  const newConsecutive = context.consecutive_correct + 1;
  const isNewlyOvercome =
    newConsecutive >= OVERCOME_CONSECUTIVE && !context.is_overcome;

  return { is_newly_overcome: isNewlyOvercome, should_re_register: false };
}
