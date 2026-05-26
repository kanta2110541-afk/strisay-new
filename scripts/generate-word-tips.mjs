/**
 * 覚えるコツ・ビジネス使い方・間違えやすい理由を事前生成するスクリプト
 * 実行方法: node scripts/generate-word-tips.mjs
 * 事前に ANTHROPIC_API_KEY を環境変数に設定してください
 * 例: $env:ANTHROPIC_API_KEY="sk-ant-..."  (PowerShell)
 *
 * 出力:
 *   data/word_memory_tips.json    ... 覚えるコツ
 *   data/word_usage_tips.json     ... ビジネスでの使い方
 *   data/word_why_difficult.json  ... 間違えやすい理由
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_PATH      = join(__dirname, "../data/toeic_wordlist.json");
const MEMORY_PATH     = join(__dirname, "../data/word_memory_tips.json");
const USAGE_PATH      = join(__dirname, "../data/word_usage_tips.json");
const WHY_PATH        = join(__dirname, "../data/word_why_difficult.json");
const BATCH_SIZE      = 10;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const words        = JSON.parse(readFileSync(WORDS_PATH, "utf-8"));
const memoryTips   = existsSync(MEMORY_PATH) ? JSON.parse(readFileSync(MEMORY_PATH, "utf-8")) : {};
const usageTips    = existsSync(USAGE_PATH)  ? JSON.parse(readFileSync(USAGE_PATH,  "utf-8")) : {};
const whyDifficult = existsSync(WHY_PATH)    ? JSON.parse(readFileSync(WHY_PATH,    "utf-8")) : {};

const remaining = words.filter((w) =>
  !memoryTips[String(w.id)] || !usageTips[String(w.id)] || !whyDifficult[String(w.id)]
);
console.log(`全${words.length}語 / 生成済み${words.length - remaining.length}語 / 残り${remaining.length}語`);

if (remaining.length === 0) {
  console.log("すべて生成済みです。");
  process.exit(0);
}

function save() {
  writeFileSync(MEMORY_PATH, JSON.stringify(memoryTips,   null, 2), "utf-8");
  writeFileSync(USAGE_PATH,  JSON.stringify(usageTips,    null, 2), "utf-8");
  writeFileSync(WHY_PATH,    JSON.stringify(whyDifficult, null, 2), "utf-8");
}

function tryParseJson(text) {
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

async function generateBatch(batch) {
  const wordList = batch
    .map((w) => `ID:${w.id} "${w.word}"(${w.pos}) 意味:${w.meaning} シーン:${w.example_scene} 類似:${w.similar}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `TOEIC学習者（社会人）向けに、各英単語について3点を日本語で生成してください。

1. memory_tip: 覚えるコツ。語源・語呂合わせ・類語との違いなど。70文字以内。
2. usage_tip: ビジネスでの使い方。具体的な使用場面・フレーズ例。70文字以内。
3. why_difficult: 間違えやすい理由。似た単語との混同・ニュアンスの難しさなど。70文字以内。共感的に書くこと。

重要: 文字列内にダブルクォート(")を使わないこと。
JSON形式のみで返答:
{ "tips": { "ID番号": { "memory_tip": "...", "usage_tip": "...", "why_difficult": "..." } } }

単語リスト:
${wordList}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return tryParseJson(text);
}

async function generateSingle(w) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 250,
    messages: [{
      role: "user",
      content: `英単語 ID:${w.id} "${w.word}"(${w.pos}) 意味:${w.meaning} 類似:${w.similar}
以下をJSON形式で。文字列内にダブルクォート不使用。各70文字以内。
{ "memory_tip": "覚えるコツ", "usage_tip": "ビジネスでの使い方", "why_difficult": "間違えやすい理由（共感的に）" }`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return tryParseJson(text);
}

const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);

for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
  const batch    = remaining.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  console.log(`バッチ ${batchNum}/${totalBatches}: ${batch[0].word} 〜 ${batch[batch.length - 1].word}`);

  let parsed = null;
  try { parsed = await generateBatch(batch); } catch (err) {
    console.error(`  バッチAPIエラー: ${err.message}`);
  }

  if (parsed?.tips) {
    for (const [id, val] of Object.entries(parsed.tips)) {
      if (val.memory_tip)    memoryTips[id]   = val.memory_tip;
      if (val.usage_tip)     usageTips[id]    = val.usage_tip;
      if (val.why_difficult) whyDifficult[id] = val.why_difficult;
    }
    save();
    console.log(`  完了 (累計 ${Object.keys(whyDifficult).length}語)`);
  } else {
    console.log(`  バッチパース失敗 → 1語ずつリトライ`);
    for (const w of batch) {
      if (whyDifficult[String(w.id)]) continue;
      try {
        const single = await generateSingle(w);
        if (single?.memory_tip)    memoryTips[String(w.id)]   = single.memory_tip;
        if (single?.usage_tip)     usageTips[String(w.id)]    = single.usage_tip;
        if (single?.why_difficult) whyDifficult[String(w.id)] = single.why_difficult;
        process.stdout.write(`  ${w.word}(${w.id}) `);
      } catch (err) {
        console.error(`  ${w.word}(${w.id}) エラー: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    save();
    console.log(`\n  リトライ完了 (累計 ${Object.keys(whyDifficult).length}語)`);
  }

  if (i + BATCH_SIZE < remaining.length) {
    await new Promise((r) => setTimeout(r, 800));
  }
}

const stillMissing = words.filter((w) => !whyDifficult[String(w.id)]);
console.log(`\n完了: memory=${Object.keys(memoryTips).length}語 / usage=${Object.keys(usageTips).length}語 / why=${Object.keys(whyDifficult).length}語`);
if (stillMissing.length > 0) {
  console.log(`未生成: ${stillMissing.length}語 — 再実行で続きから再開されます`);
}
