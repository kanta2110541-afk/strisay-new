import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import words from "../../../../data/toeic_wordlist.json";
import { Word } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: weakData } = await supabase
    .from("weak_words")
    .select("vocabulary_id, mistake_count")
    .eq("user_id", user.id)
    .eq("is_overcome", false);

  const allWords = words as Word[];
  const result = (weakData ?? []).map((w) => {
    const word = allWords.find((v) => v.id === w.vocabulary_id);
    return {
      vocabulary_id: w.vocabulary_id,
      word: word?.word ?? "",
      meaning: word?.meaning ?? "",
      mistake_count: w.mistake_count,
    };
  });

  return NextResponse.json({ words: result });
}
