"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarView } from "@/components/CalendarView";
import { InstallBanner } from "@/components/InstallBanner";
import { MasteredWordsResponse, DailyStat, Word } from "@/types";
import allWords from "../../data/toeic_wordlist.json";

const todayWord = (): Word => {
  const words = allWords as Word[];
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return words[seed % words.length];
};

export default function HomePage() {
  const router = useRouter();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [streakDays, setStreakDays] = useState(0);
  const [wordRevealed, setWordRevealed] = useState(false);
  const dailyWord = todayWord();
  const [masteredTotal, setMasteredTotal] = useState(0);
  const [calendarStats, setCalendarStats] = useState<DailyStat[]>([]);
  const [aiComment, setAiComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/streak").then((r) => r.json()),
      fetch("/api/mastered-words").then((r) => r.json()),
      fetch("/api/weak-words").then((r) => r.json()),
      fetch(`/api/calendar?year=${year}&month=${month}`).then((r) => r.json()),
    ]).then(([streak, mastered, weak, calData]: [
      { streak_days: number },
      MasteredWordsResponse,
      { words: { vocabulary_id: number }[] },
      { stats: DailyStat[] }
    ]) => {
      setStreakDays(streak.streak_days ?? 0);
      setMasteredTotal(mastered.total ?? 0);
      setCalendarStats(calData.stats ?? []);

      return fetch("/api/ai-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streak_days: streak.streak_days ?? 0,
          correct_rate: 0,
          word_count: 0,
          weak_word_count: weak.words?.length ?? 0,
          newly_mastered: 0,
        }),
      }).then((r) => r.json());
    }).then((commentData) => {
      setAiComment(commentData.comment ?? "");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="h-dvh bg-slate-50 flex flex-col overflow-hidden">
      <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-3 flex flex-col gap-2.5 flex-1 min-h-0">

        {/* ヘッダー：タイトル＋統計 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-600">Striday</h1>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>習得 <span className="font-bold text-slate-700 text-sm">{masteredTotal}</span> 語</span>
            <span>累計 <span className="font-bold text-slate-700 text-sm">{streakDays}</span> 日</span>
          </div>
        </div>

        {/* 今日の1語：横1行コンパクト */}
        <button
          onClick={() => setWordRevealed((v) => !v)}
          className="w-full bg-white rounded-xl px-4 py-2.5 shadow-sm text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-400">今日の1語</span>
              <span className="text-base font-bold text-slate-800">{dailyWord.word}</span>
              <span className="text-xs text-slate-400">{dailyWord.pos}</span>
            </div>
            <span className="text-slate-300 text-xs">{wordRevealed ? "▲" : "▼"}</span>
          </div>
          {wordRevealed && (
            <p className="text-slate-600 text-sm mt-1">{dailyWord.meaning}</p>
          )}
        </button>

        {/* カレンダー：固定サイズ */}
        <div className="bg-white rounded-xl px-4 pt-3 pb-2 shadow-sm shrink-0">
          <p className="text-slate-500 text-xs mb-2">{year}年{month}月</p>
          <CalendarView stats={calendarStats} year={year} month={month} />
        </div>

        {/* スペーサー：コンテンツとアクションの間 */}
        <div className="flex-1 min-h-0" />

        {/* メインボタン：サイズ据え置き */}
        <button
          onClick={() => router.push("/study")}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white h-14 rounded-2xl text-lg font-semibold transition-colors shadow-sm shrink-0"
        >
          今日の学習をはじめる
        </button>

        {/* 学習記録ボタン */}
        <button
          onClick={() => router.push("/calendar")}
          className="w-full bg-white hover:bg-slate-100 text-slate-600 h-12 rounded-xl text-sm transition-colors shadow-sm shrink-0"
        >
          学習記録を見る →
        </button>

        {/* AIコメント：最下部 */}
        {aiComment && (
          <div className="bg-green-50 rounded-xl px-4 py-3 shrink-0">
            <p className="text-green-700 text-xs leading-relaxed">{aiComment}</p>
          </div>
        )}

      </div>
      <InstallBanner />
    </div>
  );
}
