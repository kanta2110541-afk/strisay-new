"use client";

import { useState } from "react";
import { Word } from "@/types";

type ReviewWord = Word & { is_correct: boolean };
type Examples = Record<string, { en: string; ja: string }>;

type Props = {
  words: ReviewWord[];
  examples: Examples;
  loadingExamples: boolean;
};

export function WordReviewList({ words, examples, loadingExamples }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-2">
      <p className="text-slate-600 text-sm font-medium">今回の単語を振り返る</p>
      {words.map((w) => {
        const isOpen = openId === w.id;
        const example = examples[String(w.id)];
        return (
          <div key={w.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggle(w.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`text-base ${w.is_correct ? "text-green-500" : "text-red-400"}`}>
                  {w.is_correct ? "○" : "×"}
                </span>
                <span className="text-slate-800 text-sm font-medium">{w.word}</span>
                <span className="text-slate-400 text-xs">{w.pos}</span>
              </div>
              <span className="text-slate-300 text-xs">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                <div className="pt-3">
                  <p className="text-slate-500 text-xs mb-1">意味</p>
                  <p className="text-slate-800 text-sm">{w.meaning}</p>
                </div>

                {w.similar && (
                  <div>
                    <p className="text-slate-500 text-xs mb-1">類似語</p>
                    <p className="text-slate-600 text-sm">{w.similar}</p>
                  </div>
                )}

                <div>
                  <p className="text-slate-500 text-xs mb-1">使用シーン</p>
                  <p className="text-slate-600 text-sm">{w.example_scene}</p>
                </div>

                <div>
                  <p className="text-slate-500 text-xs mb-1">例文</p>
                  {loadingExamples ? (
                    <p className="text-slate-400 text-sm animate-pulse">生成中...</p>
                  ) : example ? (
                    <div className="space-y-1">
                      <p className="text-slate-800 text-sm italic">{example.en}</p>
                      <p className="text-slate-500 text-xs">{example.ja}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">例文を取得できませんでした</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
