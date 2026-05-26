/** @jest-environment node */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { POST } from "@/app/api/overcome-word/route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(data: unknown = null) {
  const result = { data, error: null };
  const c: Record<string, unknown> = {};
  ["select","eq","update"].forEach((m) => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.single = jest.fn().mockResolvedValue(result);
  c.upsert = jest.fn().mockResolvedValue(result);
  c.then = (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn);
  c.catch = (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn);
  return c;
}

function buildSupabase(user: object | null = { id: "user-1" }, weakRecord: unknown = { id: "weak-1" }) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: jest.fn().mockImplementation(() => makeChain(weakRecord)),
  };
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/overcome-word", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/overcome-word", () => {
  beforeEach(() => jest.clearAllMocks());

  // I-20: 苦手単語に対して克服記録を送信
  test("I-20: 苦手単語に対して克服記録を送信すると is_overcome=true に更新される（200）", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase() as never);
    const req = makeRequest({ vocabulary_id: 1 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("success", true);
  });

  // I-21: 苦手単語でない単語に対して送信
  test("I-21: 苦手単語でない単語に対して送信すると400が返される", async () => {
    mockCreateClient.mockResolvedValue(buildSupabase({ id: "user-1" }, null) as never);
    const req = makeRequest({ vocabulary_id: 999 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
