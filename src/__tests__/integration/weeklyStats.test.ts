/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { GET } from "@/app/api/weekly-stats/route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(data: unknown = null) {
  const result = { data, error: null };
  const c: Record<string, unknown> = {};
  ["select","eq","gte"].forEach((m) => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.single = jest.fn().mockResolvedValue(result);
  c.then = (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn);
  c.catch = (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn);
  return c;
}

function buildSupabase(
  user: object | null = { id: "user-1" },
  masteredData: unknown[] = [],
  weakData: unknown[] = [],
  correctData: unknown[] = []
) {
  let callCount = 0;
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "vocabulary_progress") return makeChain(masteredData);
      if (table === "study_logs") {
        // first call returns weak data (is_correct=false), second returns correct data
        const data = callCount === 0 ? weakData : correctData;
        callCount++;
        return makeChain(data);
      }
      return makeChain([]);
    }),
  };
}

describe("GET /api/weekly-stats", () => {
  beforeEach(() => jest.clearAllMocks());

  // I-16: 正常リクエスト
  test("I-16: 正常リクエストで週別統計データが返される（200）", async () => {
    const now = new Date().toISOString();
    const masteredData = [{ mastered_at: now }];
    const weakData = [{ vocabulary_id: 1, created_at: now }];
    const correctData = [{ created_at: now }];
    mockCreateClient.mockResolvedValue(
      buildSupabase({ id: "user-1" }, masteredData, weakData, correctData) as never
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("weeks");
    expect(Array.isArray(body.weeks)).toBe(true);
    if (body.weeks.length > 0) {
      expect(body.weeks[0]).toHaveProperty("week");
      expect(body.weeks[0]).toHaveProperty("mastered_count");
      expect(body.weeks[0]).toHaveProperty("weak_count");
      expect(body.weeks[0]).toHaveProperty("correct_count");
    }
  });

  // I-17: データが1週分しかない場合
  test("I-17: データが1週分しかない場合、1週分のみ返される", async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const date = weekStart.toISOString();
    const masteredData = [{ mastered_at: date }];
    mockCreateClient.mockResolvedValue(
      buildSupabase({ id: "user-1" }, masteredData, [], []) as never
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.weeks.length).toBe(1);
  });
});
