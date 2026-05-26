import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDailyWords, getReviewCandidateIds } from "@/lib/logic/getDailyWords";
import words from "../../../../data/toeic_wordlist.json";
import { Word } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allWords = words as Word[];

  const { data: logs } = await supabase
    .from("study_logs")
    .select("vocabulary_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: weakData } = await supabase
    .from("weak_words")
    .select("vocabulary_id")
    .eq("user_id", user.id)
    .eq("is_overcome", false);

  const studiedIds = [...new Set((logs ?? []).map((l) => l.vocabulary_id))];
  const reviewIds = getReviewCandidateIds(logs ?? []);
  const weakIds = (weakData ?? []).map((w) => w.vocabulary_id);

  const dailyWords = getDailyWords(allWords, studiedIds, reviewIds, weakIds);

  return NextResponse.json({ words: dailyWords });
}
