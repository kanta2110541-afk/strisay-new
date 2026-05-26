import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import words from "../../../../data/toeic_wordlist.json";
import { Word } from "@/types";

const LEVEL_TOTALS = { 1: 40, 2: 110, 3: 150 };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: progress } = await supabase
    .from("vocabulary_progress")
    .select("vocabulary_id")
    .eq("user_id", user.id)
    .eq("is_mastered", true);

  const allWords = words as Word[];
  const masteredIds = new Set((progress ?? []).map((p) => p.vocabulary_id));
  const byLevel = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;

  for (const w of allWords) {
    if (masteredIds.has(w.id)) byLevel[w.level]++;
  }

  const levels = ([1, 2, 3] as const).map((level) => ({
    level,
    mastered: byLevel[level],
    total: LEVEL_TOTALS[level],
  }));

  return NextResponse.json({ levels });
}
