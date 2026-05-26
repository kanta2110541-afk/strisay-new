import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import memoryTips from "../../../../data/word_memory_tips.json";
import usageTips  from "../../../../data/word_usage_tips.json";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたはTOEIC学習アプリのコーチです。
社会人学習者が間違えた英単語について、なぜ間違えやすいかを共感的・簡潔に分析してください。
- 100文字以内
- 否定的・批判的な表現を使わない
- 語源・似た単語との混同・ニュアンスの難しさなど実践的なヒントを含める
- プレーンテキストのみで返す（JSONや記号不要）`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, word, pos, meaning, similar } = await req.json();
  const key = String(id);

  const [whyResponse] = await Promise.all([
    anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `"${word}"（${pos}）意味:${meaning} 類似語:${similar || "なし"} — 間違えやすい理由を教えてください。`,
      }],
    }),
  ]);

  const why_difficult = whyResponse.content[0].type === "text"
    ? whyResponse.content[0].text.trim()
    : "";

  return NextResponse.json({
    memory_tip:    (memoryTips as Record<string, string>)[key] ?? "",
    usage_tip:     (usageTips  as Record<string, string>)[key] ?? "",
    why_difficult,
  });
}
