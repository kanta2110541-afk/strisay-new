import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildCommentPrompt, SYSTEM_PROMPT } from "@/lib/logic/buildCommentPrompt";
import { AICommentRequest } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: AICommentRequest = await request.json();
  const userPrompt = buildCommentPrompt(body);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const comment =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ comment: "今日も学習できました。この積み上げが力になります。" });
  }
}
