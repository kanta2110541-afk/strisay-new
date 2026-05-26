import { AICommentRequest } from "@/types";

export const SYSTEM_PROMPT = `あなたは英単語学習アプリ「Striday」のコーチです。
ユーザーの学習データをもとに、短い励ましコメントを1〜2文で返してください。

以下のルールを必ず守ってください：
- 否定表現を使わない
- 他者との比較をしない
- プレッシャーを与えない
- 継続・小さな成長を称賛する
- 「でも」「しかし」などの逆接を使わない
- 出力は日本語で1〜2文のみ`;

export function buildCommentPrompt(data: AICommentRequest): string {
  const correctPercent = Math.round(data.correct_rate * 100);

  const lines = [
    `累計学習日数：${data.streak_days}日`,
    `今日の正答率：${correctPercent}%`,
    `学習単語数：${data.word_count}語`,
    `苦手単語数：${data.weak_word_count}語`,
    `今日新たに習得した単語数：${data.newly_mastered}語`,
  ];

  return lines.join("\n");
}
