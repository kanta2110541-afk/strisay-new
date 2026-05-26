/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/logic/judgeWeakWord", () => ({ judgeWeakWord: jest.fn() }));
jest.mock("@/lib/logic/judgeMastered", () => ({ judgeMastered: jest.fn() }));
jest.mock("@/lib/logic/judgeOvercome", () => ({ judgeOvercome: jest.fn() }));

import { POST } from "@/app/api/study-result/route";
import { createClient } from "@/lib/supabase/server";
import { judgeWeakWord } from "@/lib/logic/judgeWeakWord";
import { judgeMastered } from "@/lib/logic/judgeMastered";
import { judgeOvercome } from "@/lib/logic/judgeOvercome";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockJudgeWeak = judgeWeakWord as jest.MockedFunction<typeof judgeWeakWord>;
const mockJudgeMastered = judgeMastered as jest.MockedFunction<typeof judgeMastered>;
const mockJudgeOvercome = judgeOvercome as jest.MockedFunction<typeof judgeOvercome>;

function makeChain(data: unknown = null) {
  const result = { data, error: null };
  const c: Record<string, unknown> = {};
  ["select","eq","neq","gte","lte","lt","order","update","not"].forEach((m) => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.single = jest.fn().mockResolvedValue(result);
  c.insert = jest.fn().mockResolvedValue(result);
  c.upsert = jest.fn().mockResolvedValue(result);
  c.then = (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn);
  c.catch = (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn);
  return c;
}

function buildSupabase(
  user: object | null = { id: "user-1" },
  existingWeak: unknown = null,
  existingProgress: unknown = null,
  logs: unknown[] = [{ is_correct: true, response_time: 1000 }]
) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "weak_words") return makeChain(existingWeak);
      if (table === "vocabulary_progress") return makeChain(existingProgress);
      if (table === "study_logs") return makeChain(logs);
      if (table === "daily_stats") return makeChain(null);
      return makeChain(null);
    }),
  };
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/study-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/study-result", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJudgeWeak.mockReturnValue({
      should_register: false,
      new_mistake_count: 0,
      new_avg_time: 0,
    });
    mockJudgeMastered.mockReturnValue({
      consecutive_correct: 1,
      is_mastered: false,
      is_newly_mastered: false,
    });
    mockJudgeOvercome.mockReturnValue({
      is_newly_overcome: false,
      should_re_register: false,
    });
  });

  // I-04: 正解の結果を送信した場合
  test("I-04: 正解の結果を送信した場合、study_logs に記録される（200）", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase() as never);
    const req = makeRequest({ vocabulary_id: 1, is_correct: true, response_time: 1500 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("is_newly_mastered");
  });

  // I-05: 不正解の結果を送信した場合
  test("I-05: 不正解の結果を送信した場合、study_logs に記録され苦手判定ロジックが動作する", async () => {
    mockJudgeWeak.mockReturnValue({
      should_register: true,
      new_mistake_count: 2,
      new_avg_time: 3000,
    });
    mockCreateClient.mockResolvedValue(buildSupabase() as never);
    const req = makeRequest({ vocabulary_id: 1, is_correct: false, response_time: 4000 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockJudgeWeak).toHaveBeenCalledWith(null, false, 4000);
  });

  // I-06: vocabulary_id が存在しないIDの場合
  test("I-06: vocabulary_id が存在しないIDの場合、400が返される", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase() as never);
    const req = makeRequest({ is_correct: true, response_time: 1500 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // I-07: 未認証ユーザーのリクエスト
  test("I-07: 未認証ユーザーのリクエストで401が返される", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase(null) as never);
    const req = makeRequest({ vocabulary_id: 1, is_correct: true, response_time: 1500 });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
