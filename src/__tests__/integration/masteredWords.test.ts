/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { GET } from "@/app/api/mastered-words/route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(data: unknown = null) {
  const result = { data, error: null };
  const c: Record<string, unknown> = {};
  ["select","eq"].forEach((m) => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.single = jest.fn().mockResolvedValue(result);
  c.then = (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn);
  c.catch = (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn);
  return c;
}

function buildSupabase(user: object | null = { id: "user-1" }, progress: unknown[] = []) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: jest.fn().mockImplementation(() => makeChain(progress)),
  };
}

describe("GET /api/mastered-words", () => {
  beforeEach(() => jest.clearAllMocks());

  // I-14: 正常リクエスト
  test("I-14: 正常リクエストで習得単語数とレベル別集計が返される（200）", async () => {
    const progress = [
      { vocabulary_id: 1, is_mastered: true },
      { vocabulary_id: 2, is_mastered: true },
    ];
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, progress) as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("by_level");
    expect(body.by_level).toHaveProperty("1");
    expect(body.by_level).toHaveProperty("2");
    expect(body.by_level).toHaveProperty("3");
  });

  // I-15: 習得単語が0件の場合
  test("I-15: 習得単語が0件の場合、件数0・空データが返される（200）", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, []) as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.by_level["1"].mastered).toBe(0);
    expect(body.by_level["2"].mastered).toBe(0);
    expect(body.by_level["3"].mastered).toBe(0);
  });
});
