import { judgeMastered } from "@/lib/logic/judgeMastered";

describe("judgeMastered", () => {
  // U-11: 3回連続正解で習得
  test("U-11: 3回連続正解でis_masteredがtrueになる", () => {
    let state = judgeMastered(null, true);
    state = judgeMastered({ consecutive_correct: state.consecutive_correct, is_mastered: state.is_mastered }, true);
    state = judgeMastered({ consecutive_correct: state.consecutive_correct, is_mastered: state.is_mastered }, true);
    expect(state.is_mastered).toBe(true);
    expect(state.is_newly_mastered).toBe(true);
  });

  // U-12: 2回連続正解では習得にならない
  test("U-12: 2回連続正解ではis_masteredがfalseのまま", () => {
    let state = judgeMastered(null, true);
    state = judgeMastered({ consecutive_correct: state.consecutive_correct, is_mastered: state.is_mastered }, true);
    expect(state.is_mastered).toBe(false);
  });

  // U-13: 2回正解後に誤答でリセット
  test("U-13: 2回正解後に誤答するとconsecutive_correctが0になる", () => {
    let state = judgeMastered(null, true);
    state = judgeMastered({ consecutive_correct: state.consecutive_correct, is_mastered: state.is_mastered }, true);
    state = judgeMastered({ consecutive_correct: state.consecutive_correct, is_mastered: state.is_mastered }, false);
    expect(state.consecutive_correct).toBe(0);
    expect(state.is_mastered).toBe(false);
  });

  // U-14: リセット後に再度3回連続正解で習得
  test("U-14: リセット後に再度3回連続正解でis_masteredがtrueになる", () => {
    let state = { consecutive_correct: 0, is_mastered: false };
    state = judgeMastered(state, true);
    state = judgeMastered(state, true);
    state = judgeMastered(state, true);
    expect(state.is_mastered).toBe(true);
  });

  // U-15: 習得済みを誤答すると未習得に戻る
  test("U-15: 習得済みの単語を誤答するとis_masteredがfalseに戻る", () => {
    const state = judgeMastered({ consecutive_correct: 3, is_mastered: true }, false);
    expect(state.is_mastered).toBe(false);
    expect(state.consecutive_correct).toBe(0);
  });
});
