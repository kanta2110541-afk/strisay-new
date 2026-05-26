/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { GET } from "@/app/api/calendar/route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(data: unknown = null) {
  const result = { data, error: null };
  const c: Record<string, unknown> = {};
  ["select","eq","gte","lte","order"].forEach((m) => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.single = jest.fn().mockResolvedValue(result);
  c.then = (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn);
  c.catch = (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn);
  return c;
}

function buildSupabase(user: object | null = { id: "user-1" }, stats: unknown[] = []) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: jest.fn().mockImplementation(() => makeChain(stats)),
  };
}

function makeRequest(year = "2026", month = "5") {
  return new Request(`http://localhost/api/calendar?year=${year}&month=${month}`);
}

describe("GET /api/calendar", () => {
  beforeEach(() => jest.clearAllMocks());

  // I-08: 正常リクエスト
  test("I-08: 正常リクエストで月間の daily_stats が返される（200）", async () => {
    const stats = [
      { study_date: "2026-05-01", study_time: 120, correct_rate: 0.8, word_count: 10 },
      { study_date: "2026-05-10", study_time: 90, correct_rate: 0.7, word_count: 10 },
    ];
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, stats) as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("stats");
    expect(Array.isArray(body.stats)).toBe(true);
    expect(body.stats.length).toBe(2);
  });

  // I-09: 学習履歴がない日
  test("I-09: 学習履歴がない場合、空配列が返される（200）", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, []) as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats).toEqual([]);
  });

  // I-10: 未認証ユーザーのリクエスト
  test("I-10: 未認証ユーザーのリクエストで401が返される", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase(null) as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});
