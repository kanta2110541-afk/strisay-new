/**
 * 実行方法: node scripts/generate-examples.mjs
 * 事前に ANTHROPIC_API_KEY を環境変数に設定してください
 * 例: $env:ANTHROPIC_API_KEY="sk-ant-..."  (PowerShell)
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_PATH = join(__dirname, "../data/toeic_wordlist.json");
const OUTPUT_PATH = join(__dirname, "../data/word_examples.json");
const BATCH_SIZE = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const words = JSON.parse(readFileSync(WORDS_PATH, "utf-8"));

const existing = existsSync(OUTPUT_PATH)
  ? JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"))
  : {};

const remaining = words.filter((w) => !existing[String(w.id)]);
console.log(`全${words.length}語 / 生成済み${Object.keys(existing).length}語 / 残り${remaining.length}語`);

if (remaining.length === 0) {
  console.log("すべての例文が生成済みです。");
  process.exit(0);
}

for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
  const batch = remaining.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);
  console.log(`バッチ ${batchNum}/${totalBatches} 処理中... (${batch[0].word} 〜 ${batch[batch.length - 1].word})`);

  const wordList = batch
    .map((w) => `ID:${w.id} "${w.word}"（${w.pos}）意味:${w.meaning} シーン:${w.example_scene}`)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `TOEICまたはビジネスシーンで使われる自然な英文例文を各単語に1文生成してください。
JSON形式で返してください: { "examples": { "単語ID": { "en": "英文", "ja": "日本語訳" } } }
余計な説明は不要です。

単語リスト:
${wordList}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`バッチ ${batchNum}: JSONパース失敗`);
      continue;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    Object.assign(existing, parsed.examples ?? {});
    writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2), "utf-8");
    console.log(`バッチ ${batchNum} 完了 (累計 ${Object.keys(existing).length}語)`);

    if (i + BATCH_SIZE < remaining.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error(`バッチ ${batchNum} エラー:`, err.message);
  }
}

console.log(`\n完了: ${OUTPUT_PATH} に ${Object.keys(existing).length}語分の例文を保存しました。`);
