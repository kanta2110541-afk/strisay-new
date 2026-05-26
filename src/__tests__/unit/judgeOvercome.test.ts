import { judgeOvercome } from "@/lib/logic/judgeOvercome";

describe("judgeOvercome", () => {
  // U-16: 苦手単語2回連続正解で克服
  test("U-16: 苦手単語を2回連続正解するとis_newly_overcomeがtrueになる", () => {
    const ctx = { is_weak: true, consecutive_correct: 1, is_overcome: false };
    const result = judgeOvercome(ctx, true);
    expect(result.is_newly_overcome).toBe(true);
  });

  // U-17: 1回正解では克服にならない
  test("U-17: 苦手単語を1回正解してもis_newly_overcomeがfalseのまま", () => {
    const ctx = { is_weak: true, consecutive_correct: 0, is_overcome: false };
    const result = judgeOvercome(ctx, true);
    expect(result.is_newly_overcome).toBe(false);
  });

  // U-18: 苦手単語でない場合はスキップ
  test("U-18: 苦手単語でない単語には克服判定が実行されない", () => {
    const ctx = { is_weak: false, consecutive_correct: 5, is_overcome: false };
    const result = judgeOvercome(ctx, true);
    expect(result.is_newly_overcome).toBe(false);
  });

  // U-19: 克服済みを誤答すると再登録
  test("U-19: 克服済みの単語を誤答するとshould_re_registerがtrueになる", () => {
    const ctx = { is_weak: true, consecutive_correct: 2, is_overcome: true };
    const result = judgeOvercome(ctx, false);
    expect(result.should_re_register).toBe(true);
    expect(result.is_newly_overcome).toBe(false);
  });
});
