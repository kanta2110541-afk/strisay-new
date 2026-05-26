import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: stats } = await supabase
    .from("daily_stats")
    .select("study_date")
    .eq("user_id", user.id)
    .order("study_date", { ascending: false });

  const totalDays = stats?.length ?? 0;
  return NextResponse.json({ streak_days: totalDays });
}
