import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? new Date().getFullYear().toString();
  const month = searchParams.get("month") ?? String(new Date().getMonth() + 1);

  const start = `${year}-${month.padStart(2, "0")}-01`;
  const end = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];

  const { data: stats } = await supabase
    .from("daily_stats")
    .select("study_date, study_time, correct_rate, word_count")
    .eq("user_id", user.id)
    .gte("study_date", start)
    .lte("study_date", end)
    .order("study_date");

  return NextResponse.json({ stats: stats ?? [] });
}
