"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Word } from "@/types";
import allWords from "../../../../data/toeic_wordlist.json";
import wordExamples from "../../../../data/word_examples.json";

type Feedback = {
  memory_tip: string;
  usage_tip: string;
  why_difficult: string;
};

type Example = { en: string; ja: string };

export default function WeakWordPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const word = (allWords as Word[]).find((w) => w.id === id);
  const example = (wordExamples as Record<string, Example>)[String(id)];

  const [mistakeCount, setMistakeCount] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!word) return;

    Promise.all([
      fetch("/api/weak-words").then((r) => r.json()),
      fetch("/api/weak-word-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, word: word.word, pos: word.pos, meaning: word.meaning, similar: word.similar }),
      }).then((r) => r.json()),
    ])
      .then(([weakData, fb]) => {
        const found = weakData.words?.find(
          (w: { vocabulary_id: number; mistake_count: number }) => w.vocabulary_id === id
        );
        setMistakeCount(found?.mistake_count ?? null);
        setFeedback(fb);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, word]);

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
          <h1 className="text-xl font-bold text-slate-800">苦手単語の分析</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-slate-800">{word.word}</p>
            <p className="text-slate-400 text-sm">{word.pos}</p>
          </div>
          <p className="text-slate-600 text-base">{word.meaning}</p>
          {mistakeCount !== null && (
            <p className="text-amber-600 text-xs">間違えた回数：{mistakeCount}回</p>
          )}
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

        {loading ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
          </div>
        ) : feedback && (
          <>
            {feedback.why_difficult && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-1">
                <p className="text-amber-700 text-xs font-medium">間違えやすい理由</p>
                <p className="text-slate-700 text-sm leading-relaxed">{feedback.why_difficult}</p>
              </div>
            )}

            {feedback.memory_tip && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-1">
                <p className="text-green-700 text-xs font-medium">覚えるコツ</p>
                <p className="text-slate-700 text-sm leading-relaxed">{feedback.memory_tip}</p>
              </div>
            )}

            {feedback.usage_tip && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-1">
                <p className="text-blue-700 text-xs font-medium">ビジネスでの使い方</p>
                <p className="text-slate-700 text-sm leading-relaxed">{feedback.usage_tip}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
