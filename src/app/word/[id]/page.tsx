"use client";

import { useRouter, useParams } from "next/navigation";
import { Word } from "@/types";
import allWords from "../../../../data/toeic_wordlist.json";
import wordExamples from "../../../../data/word_examples.json";
import memoryTips from "../../../../data/word_memory_tips.json";
import usageTips from "../../../../data/word_usage_tips.json";

type Example = { en: string; ja: string };

export default function WordPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const word = (allWords as Word[]).find((w) => w.id === id);
  const example = (wordExamples as Record<string, Example>)[String(id)];
  const memoryTip = (memoryTips as Record<string, string>)[String(id)];
  const usageTip = (usageTips as Record<string, string>)[String(id)];

  if (!word) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">単語が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800">←</button>
          <h1 className="text-xl font-bold text-slate-800">単語の詳細</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-slate-800">{word.word}</p>
            <p className="text-slate-400 text-sm">{word.pos}</p>
          </div>
          <p className="text-slate-600 text-base">{word.meaning}</p>
          <p className="text-green-600 text-xs">習得済み</p>
        </div>

        {example && (
          <div className="bg-white rounded-2xl p-5 space-y-2 shadow-sm">
            <p className="text-slate-500 text-xs font-medium">例文</p>
            <p className="text-slate-800 text-sm italic">{example.en}</p>
            <p className="text-slate-500 text-xs">{example.ja}</p>
          </div>
        )}

        {word.similar && (
          <div className="bg-white rounded-2xl p-5 space-y-1 shadow-sm">
            <p className="text-slate-500 text-xs font-medium">類似語</p>
            <p className="text-slate-600 text-sm">{word.similar}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-500 text-xs font-medium">使用シーン</p>
          <p className="text-slate-600 text-sm">{word.example_scene}</p>
        </div>

        {memoryTip && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-1">
            <p className="text-green-700 text-xs font-medium">覚えるコツ</p>
            <p className="text-slate-700 text-sm leading-relaxed">{memoryTip}</p>
          </div>
        )}

        {usageTip && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-1">
            <p className="text-blue-700 text-xs font-medium">ビジネスでの使い方</p>
            <p className="text-slate-700 text-sm leading-relaxed">{usageTip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
