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
    .select("vocabulary_id, is_mastered")
    .eq("user_id", user.id)
    .eq("is_mastered", true);

  const allWords = words as Word[];
  const masteredIds = new Set((progress ?? []).map((p) => p.vocabulary_id));

  const byLevel = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
  for (const w of allWords) {
    if (masteredIds.has(w.id)) byLevel[w.level]++;
  }

  return NextResponse.json({
    total: masteredIds.size,
    by_level: {
      1: { mastered: byLevel[1], total: LEVEL_TOTALS[1] },
      2: { mastered: byLevel[2], total: LEVEL_TOTALS[2] },
      3: { mastered: byLevel[3], total: LEVEL_TOTALS[3] },
    },
  });
}
