import { judgeWeakWord } from "@/lib/logic/judgeWeakWord";

describe("judgeWeakWord", () => {
  // U-06: 2回誤答で苦手登録
  test("U-06: 2回誤答でweak_wordsに登録される", () => {
    const existing = { vocabulary_id: 1, mistake_count: 1, avg_response_time: 3000, is_overcome: false };
    const result = judgeWeakWord(existing, false, 3000);
    expect(result.should_register).toBe(true);
    expect(result.new_mistake_count).toBe(2);
  });

  // U-07: 1回誤答では登録されない
  test("U-07: 1回誤答ではweak_wordsに登録されない", () => {
    const result = judgeWeakWord(null, false, 3000);
    expect(result.should_register).toBe(false);
    expect(result.new_mistake_count).toBe(1);
  });

  // U-08: 回答時間が閾値超過で登録
  test("U-08: 回答時間が閾値を超えた場合に登録される", () => {
    const result = judgeWeakWord(null, true, 9000);
    expect(result.should_register).toBe(true);
  });

  // U-09: 閾値以下の回答時間だけでは登録されない
  test("U-09: 回答時間が閾値以下では正解時に登録されない", () => {
    const result = judgeWeakWord(null, true, 3000);
    expect(result.should_register).toBe(false);
  });

  // U-10: 既存レコードのmistake_countがインクリメント
  test("U-10: 既登録の単語を誤答するとmistake_countが増える", () => {
    const existing = { vocabulary_id: 1, mistake_count: 2, avg_response_time: 4000, is_overcome: false };
    const result = judgeWeakWord(existing, false, 3000);
    expect(result.new_mistake_count).toBe(3);
  });
});
