/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { GET } from "@/app/api/daily-words/route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

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

function buildSupabase(user: object | null = { id: "user-1" }, logs: unknown[] = [], weak: unknown[] = []) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "study_logs") return makeChain(logs);
      if (table === "weak_words") return makeChain(weak);
      return makeChain([]);
    }),
  };
}

describe("GET /api/daily-words", () => {
  beforeEach(() => jest.clearAllMocks());

  // I-01: 正常リクエスト
  test("I-01: 正常リクエストで単語リストが返される（200）", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase() as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("words");
    expect(Array.isArray(body.words)).toBe(true);
  });

  // I-02: 未認証
  test("I-02: 未認証ユーザーのリクエストで401が返される", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase(null) as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  // I-03: セッション問題数（SESSION_SIZE=10）
  test("I-03: 返却される単語数が1セッション分（10問以下）である", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase() as never);
    const res = await GET();
    const body = await res.json();
    expect(body.words.length).toBeLessThanOrEqual(10);
    expect(body.words.length).toBeGreaterThan(0);
  });
});
