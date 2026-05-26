import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { judgeWeakWord } from "@/lib/logic/judgeWeakWord";
import { judgeMastered } from "@/lib/logic/judgeMastered";
import { judgeOvercome } from "@/lib/logic/judgeOvercome";
import { StudyResult } from "@/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: StudyResult = await request.json();
  const { vocabulary_id, is_correct, response_time } = body;

  if (!vocabulary_id || is_correct === undefined || response_time === undefined) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("study_logs").insert({
    user_id: user.id,
    vocabulary_id,
    is_correct,
    response_time,
  });
  if (insertError) console.error("study_logs insert error:", insertError);

  const { data: existingWeak } = await supabase
    .from("weak_words")
    .select("*")
    .eq("user_id", user.id)
    .eq("vocabulary_id", vocabulary_id)
    .single();

  const weakJudge = judgeWeakWord(existingWeak, is_correct, response_time);
  if (weakJudge.should_register) {
    await supabase.from("weak_words").upsert({
      user_id: user.id,
      vocabulary_id,
      mistake_count: weakJudge.new_mistake_count,
      avg_response_time: weakJudge.new_avg_time,
      is_overcome: false,
    }, { onConflict: "user_id,vocabulary_id" });
  }

  const { data: existingProgress } = await supabase
    .from("vocabulary_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("vocabulary_id", vocabulary_id)
    .single();

  const masteredJudge = judgeMastered(existingProgress, is_correct);
  await supabase.from("vocabulary_progress").upsert({
    user_id: user.id,
    vocabulary_id,
    consecutive_correct: masteredJudge.consecutive_correct,
    is_mastered: masteredJudge.is_mastered,
    mastered_at: masteredJudge.is_mastered && masteredJudge.is_newly_mastered
      ? new Date().toISOString()
      : existingProgress?.mastered_at ?? null,
  }, { onConflict: "user_id,vocabulary_id" });

  let isNewlyOvercome = false;
  if (existingWeak) {
    const overcomeJudge = judgeOvercome(
      {
        is_weak: true,
        consecutive_correct: masteredJudge.consecutive_correct - (is_correct ? 1 : 0),
        is_overcome: existingWeak.is_overcome,
      },
      is_correct
    );
    isNewlyOvercome = overcomeJudge.is_newly_overcome;
    if (isNewlyOvercome) {
      await supabase.from("weak_words").update({
        is_overcome: true,
        overcome_at: new Date().toISOString(),
      }).eq("user_id", user.id).eq("vocabulary_id", vocabulary_id);
    }
    if (overcomeJudge.should_re_register) {
      await supabase.from("weak_words").update({
        is_overcome: false,
        overcome_at: null,
      }).eq("user_id", user.id).eq("vocabulary_id", vocabulary_id);
    }
  }

  await updateDailyStats(supabase, user.id);

  return NextResponse.json({
    is_newly_mastered: masteredJudge.is_newly_mastered,
    is_newly_overcome: isNewlyOvercome,
  });
}

async function updateDailyStats(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: todayLogs } = await supabase
    .from("study_logs")
    .select("is_correct, response_time")
    .eq("user_id", userId)
    .gte("created_at", `${today}T00:00:00`);

  if (!todayLogs || todayLogs.length === 0) return;

  const wordCount = todayLogs.length;
  const correctCount = todayLogs.filter((l) => l.is_correct).length;
  const correctRate = correctCount / wordCount;
  const studyTime = Math.floor(todayLogs.reduce((acc, l) => acc + l.response_time, 0) / 1000);

  await supabase.from("daily_stats").upsert({
    user_id: userId,
    study_date: today,
    word_count: wordCount,
    correct_rate: correctRate,
    study_time: studyTime,
  }, { onConflict: "user_id,study_date" });
}
