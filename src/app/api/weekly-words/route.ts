import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ error: "week is required" }, { status: 400 });

  const weekStart = new Date(week);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [{ data: masteredData }, { data: weakData }, { data: correctData }] = await Promise.all([
    supabase
      .from("vocabulary_progress")
      .select("vocabulary_id")
      .eq("user_id", user.id)
      .eq("is_mastered", true)
      .gte("mastered_at", weekStart.toISOString())
      .lt("mastered_at", weekEnd.toISOString()),
    supabase
      .from("study_logs")
      .select("vocabulary_id")
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", weekEnd.toISOString()),
    supabase
      .from("study_logs")
      .select("vocabulary_id")
      .eq("user_id", user.id)
      .eq("is_correct", true)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", weekEnd.toISOString()),
  ]);

  const masteredIds = (masteredData ?? []).map((r) => r.vocabulary_id);
  const weakIds = [...new Set((weakData ?? []).map((r) => r.vocabulary_id))];
  const correctIds = [...new Set((correctData ?? []).map((r) => r.vocabulary_id))];

  return NextResponse.json({ mastered_ids: masteredIds, weak_ids: weakIds, correct_ids: correctIds });
}
