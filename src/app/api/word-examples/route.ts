import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import examples from "../../../../data/word_examples.json";

type WordInput = { id: number };

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { words }: { words: WordInput[] } = await req.json();
  if (!words?.length) return NextResponse.json({ examples: {} });

  const result: Record<string, unknown> = {};
  for (const w of words) {
    const key = String(w.id);
    if ((examples as Record<string, unknown>)[key]) {
      result[key] = (examples as Record<string, unknown>)[key];
    }
  }

  return NextResponse.json({ examples: result });
}
