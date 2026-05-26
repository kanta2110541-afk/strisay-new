/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { GET } from "@/app/api/level-progress/route";
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

describe("GET /api/level-progress", () => {
  beforeEach(() => jest.clearAllMocks());

  // I-18: 正常リクエスト
  test("I-18: 正常リクエストでLevel1・2・3の習得数と総数が返される（200）", async () => {
    const progress = [{ vocabulary_id: 1 }, { vocabulary_id: 2 }];
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, progress) as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("levels");
    expect(Array.isArray(body.levels)).toBe(true);
    expect(body.levels.length).toBe(3);
    const levels = body.levels as { level: number; mastered: number; total: number }[];
    expect(levels.find((l) => l.level === 1)?.total).toBe(40);
    expect(levels.find((l) => l.level === 2)?.total).toBe(110);
    expect(levels.find((l) => l.level === 3)?.total).toBe(150);
  });

  // I-19: 全レベルの習得数が0の場合
  test("I-19: 全レベルの習得数が0の場合、各レベルの習得数0・総数が正しく返される", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, []) as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    const levels = body.levels as { level: number; mastered: number; total: number }[];
    expect(levels.every((l) => l.mastered === 0)).toBe(true);
    expect(levels.find((l) => l.level === 1)?.total).toBe(40);
    expect(levels.find((l) => l.level === 2)?.total).toBe(110);
    expect(levels.find((l) => l.level === 3)?.total).toBe(150);
  });
});
