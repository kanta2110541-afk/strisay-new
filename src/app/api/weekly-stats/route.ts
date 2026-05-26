import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const since = fourWeeksAgo.toISOString();

  const [{ data: masteredData }, { data: weakData }, { data: correctData }] = await Promise.all([
    supabase
      .from("vocabulary_progress")
      .select("mastered_at")
      .eq("user_id", user.id)
      .eq("is_mastered", true)
      .gte("mastered_at", since),
    supabase
      .from("study_logs")
      .select("vocabulary_id, created_at")
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .gte("created_at", since),
    supabase
      .from("study_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("is_correct", true)
      .gte("created_at", since),
  ]);

  const getWeekKey = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split("T")[0];
  };

  const weekMap = new Map<string, { mastered: number; weakIds: Set<number>; correct: number }>();

  for (const row of masteredData ?? []) {
    if (!row.mastered_at) continue;
    const key = getWeekKey(row.mastered_at);
    const existing = weekMap.get(key) ?? { mastered: 0, weakIds: new Set(), correct: 0 };
    existing.mastered += 1;
    weekMap.set(key, existing);
  }

  for (const row of weakData ?? []) {
    const key = getWeekKey(row.created_at);
    const existing = weekMap.get(key) ?? { mastered: 0, weakIds: new Set(), correct: 0 };
    existing.weakIds.add(row.vocabulary_id);
    weekMap.set(key, existing);
  }

  for (const row of correctData ?? []) {
    const key = getWeekKey(row.created_at);
    const existing = weekMap.get(key) ?? { mastered: 0, weakIds: new Set(), correct: 0 };
    existing.correct += 1;
    weekMap.set(key, existing);
  }

  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { mastered, weakIds, correct }]) => ({
      week,
      mastered_count: mastered,
      weak_count: weakIds.size,
      correct_count: correct,
    }));

  return NextResponse.json({ weeks });
}
