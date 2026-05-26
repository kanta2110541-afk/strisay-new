import { buildCommentPrompt } from "@/lib/logic/buildCommentPrompt";

describe("buildCommentPrompt", () => {
  const base = { streak_days: 7, correct_rate: 0.82, word_count: 20, weak_word_count: 5, newly_mastered: 2 };

  // U-20: 必要データがすべてプロンプトに含まれる
  test("U-20: 累計学習日数・正答率・学習単語数・苦手単語数がプロンプトに含まれる", () => {
    const prompt = buildCommentPrompt(base);
    expect(prompt).toContain("7日");
    expect(prompt).toContain("82%");
    expect(prompt).toContain("20語");
    expect(prompt).toContain("5語");
    expect(prompt).toContain("2語");
  });

  // U-21: 累計学習日数が0でもエラーにならない
  test("U-21: 累計学習日数が0の場合（未学習）にエラーにならない", () => {
    expect(() => buildCommentPrompt({ ...base, streak_days: 0 })).not.toThrow();
    const prompt = buildCommentPrompt({ ...base, streak_days: 0 });
    expect(prompt).toContain("0日");
  });

  // U-22: 正答率が0%でもエラーにならない
  test("U-22: 正答率が0%の場合にエラーにならない", () => {
    expect(() => buildCommentPrompt({ ...base, correct_rate: 0 })).not.toThrow();
    const prompt = buildCommentPrompt({ ...base, correct_rate: 0 });
    expect(prompt).toContain("0%");
  });
});
