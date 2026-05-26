import { getDailyWords, getReviewCandidateIds } from "@/lib/logic/getDailyWords";
import { Word } from "@/types";

const makeWord = (id: number, level: 1 | 2 | 3 = 1): Word => ({
  id, word: `word${id}`, pos: "動詞", meaning: `意味${id}`,
  level, example_scene: "テスト", similar: "",
});

const allWords = Array.from({ length: 100 }, (_, i) => makeWord(i + 1));

describe("getDailyWords", () => {
  // U-01: 新規単語が80%（復習単語が十分ある前提）
  test("U-01: 出題に新規単語が約80%含まれる", () => {
    const studiedIds = Array.from({ length: 20 }, (_, i) => i + 1);
    const reviewIds = Array.from({ length: 10 }, (_, i) => i + 1);
    const result = getDailyWords(allWords, studiedIds, reviewIds, []);
    expect(result.length).toBe(10);
    const newWords = result.filter((w) => !w.is_review);
    expect(newWords.length).toBe(8);
  });

  // U-02: 復習単語が20%
  test("U-02: 出題に復習単語が約20%含まれる", () => {
    const reviewIds = Array.from({ length: 10 }, (_, i) => i + 1);
    const studiedIds = Array.from({ length: 50 }, (_, i) => i + 1);
    const result = getDailyWords(allWords, studiedIds, reviewIds, []);
    const reviewWords = result.filter((w) => w.is_review);
    expect(reviewWords.length).toBeLessThanOrEqual(4);
  });

  // U-03: 復習単語がない場合は新規100%
  test("U-03: 復習単語が存在しない初日は新規100%", () => {
    const result = getDailyWords(allWords, [], [], []);
    const reviewWords = result.filter((w) => w.is_review);
    expect(reviewWords.length).toBe(0);
  });

  // U-04: 同一単語が重複しない
  test("U-04: 同一単語が1セッション内に重複しない", () => {
    const result = getDailyWords(allWords, [], [], []);
    const ids = result.map((w) => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // U-05: 復習対象は指定IDのみ
  test("U-05: 復習対象は指定されたIDの単語のみ", () => {
    const reviewIds = [1, 2, 3];
    const result = getDailyWords(allWords, [], reviewIds, []);
    const reviewWords = result.filter((w) => w.is_review);
    reviewWords.forEach((w) => expect(reviewIds).toContain(w.id));
  });
});

describe("getReviewCandidateIds", () => {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  test("1日後・3日後・7日後の単語が復習対象になる", () => {
    const logs = [
      { vocabulary_id: 1, created_at: daysAgo(1) },
      { vocabulary_id: 2, created_at: daysAgo(3) },
      { vocabulary_id: 3, created_at: daysAgo(7) },
      { vocabulary_id: 4, created_at: daysAgo(2) },
    ];
    const result = getReviewCandidateIds(logs);
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(3);
    expect(result).not.toContain(4);
  });
});
