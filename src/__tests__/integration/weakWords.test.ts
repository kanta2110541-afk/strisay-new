/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { GET } from "@/app/api/weak-words/route";
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

function buildSupabase(user: object | null = { id: "user-1" }, weakData: unknown[] = []) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: jest.fn().mockImplementation(() => makeChain(weakData)),
  };
}

describe("GET /api/weak-words", () => {
  beforeEach(() => jest.clearAllMocks());

  // I-11: 正常リクエスト
  test("I-11: 正常リクエストで苦手単語リストが返される（200）", async () => {
    const weakData = [
      { vocabulary_id: 1, mistake_count: 2 },
      { vocabulary_id: 2, mistake_count: 3 },
    ];
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, weakData) as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("words");
    expect(Array.isArray(body.words)).toBe(true);
  });

  // I-12: 苦手単語が0件の場合
  test("I-12: 苦手単語が0件の場合、空配列が返される（200）", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, []) as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.words).toEqual([]);
  });

  // I-13: 克服済み単語は含まれない
  test("I-13: 克服済み単語（is_overcome=true）はクエリで除外される", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, []) as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const supabaseMock = (await mockCreateClient.mock.results[0].value) as {
      from: jest.Mock;
    };
    const chain = supabaseMock.from.mock.results[0]?.value as Record<string, jest.Mock>;
    expect(chain.eq).toHaveBeenCalledWith("is_overcome", false);
  });
});
