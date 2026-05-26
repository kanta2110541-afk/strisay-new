import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vocabulary_id } = await request.json();

  const { data: weak } = await supabase
    .from("weak_words")
    .select("id")
    .eq("user_id", user.id)
    .eq("vocabulary_id", vocabulary_id)
    .single();

  if (!weak) return NextResponse.json({ error: "Not a weak word" }, { status: 400 });

  await supabase.from("weak_words").update({
    is_overcome: true,
    overcome_at: new Date().toISOString(),
  }).eq("user_id", user.id).eq("vocabulary_id", vocabulary_id);

  return NextResponse.json({ success: true });
}
