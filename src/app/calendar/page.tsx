"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WeeklyChart } from "@/components/WeeklyChart";
import { LevelProgress } from "@/components/LevelProgress";
import { WeeklyStat, LevelProgress as LevelProgressType, Word } from "@/types";
import allWords from "../../../data/toeic_wordlist.json";

type SelectionType = "mastered" | "weak" | "correct";

export default function CalendarPage() {
  const router = useRouter();
  const [weeks, setWeeks] = useState<WeeklyStat[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [levels, setLevels] = useState<LevelProgressType[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SelectionType | null>(null);
  const [displayWords, setDisplayWords] = useState<Word[]>([]);
  const [wordLoading, setWordLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/weekly-stats").then((r) => r.json()),
      fetch("/api/streak").then((r) => r.json()),
      fetch("/api/level-progress").then((r) => r.json()),
    ]).then(([weekData, streakData, levelData]) => {
      setWeeks(weekData.weeks ?? []);
      setStreakDays(streakData.streak_days ?? 0);
      setLevels(levelData.levels ?? []);
    });
  }, []);

  const handleBarClick = async (week: string, type: SelectionType) => {
    if (selectedWeek === week && selectedType === type) {
      setSelectedWeek(null);
      setSelectedType(null);
      setDisplayWords([]);
      return;
    }
    setSelectedWeek(week);
    setSelectedType(type);
    setWordLoading(true);

    const res = await fetch(`/api/weekly-words?week=${week}`).then((r) => r.json());
    const words = allWords as Word[];
    const ids: number[] =
      type === "mastered" ? res.mastered_ids :
      type === "weak" ? res.weak_ids :
      res.correct_ids;
    setDisplayWords(words.filter((w) => ids.includes(w.id)));
    setWordLoading(false);
  };

  const totalMastered = levels.reduce((sum, l) => sum + l.mastered, 0);

  // L1(40語)=500点以下 / L1+L2(150語)=700点圏内 / 全300語=700点台〜 (補足事項PDFより)
  const scoreEstimate = (mastered: number): string => {
    if (mastered < 10)  return "300点台";
    if (mastered < 40)  return "400〜500点台";
    if (mastered < 80)  return "500点台";
    if (mastered < 150) return "600点台";
    if (mastered < 300) return "700点台";
    return "700点台〜";
  };

  const listLabel =
    selectedType === "mastered" ? "習得した単語" :
    selectedType === "weak" ? "苦手だった単語" :
    "正解した単語";
  const listColor =
    selectedType === "mastered" ? "text-green-600" :
    selectedType === "weak" ? "text-amber-600" :
    "text-blue-600";

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-slate-500 hover:text-slate-800">←</button>
          <h1 className="text-xl font-bold text-slate-800">学習記録</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="space-y-1 pr-4">
              <p className="text-slate-500 text-xs">累計学習日数</p>
              <p className="text-3xl font-bold text-slate-800">{streakDays}<span className="text-base text-slate-400 ml-1">日</span></p>
            </div>
            <div className="space-y-1 pl-4">
              <p className="text-slate-500 text-xs">TOEIC スコア目安</p>
              <p className="text-2xl font-bold text-green-600">{scoreEstimate(totalMastered)}</p>
              <p className="text-slate-400 text-xs">習得{totalMastered}語 / 300語</p>
            </div>
          </div>
          {totalMastered >= 150 && (
            <p className="text-slate-400 text-xs border-t border-slate-100 pt-2">
              語彙の土台が整ってきました。文法・リスニング対策と組み合わせると800点台も射程に入ります。
            </p>
          )}
          {totalMastered < 150 && totalMastered > 0 && (
            <p className="text-slate-400 text-xs border-t border-slate-100 pt-2">
              この300語がTOEICの語彙基盤です。習得を積み重ねながら文法・リスニングも少しずつ触れてみましょう。
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <WeeklyChart
            weeks={weeks}
            selectedWeek={selectedWeek ?? undefined}
            selectedType={selectedType ?? undefined}
            onBarClick={handleBarClick}
          />
        </div>

        {selectedWeek && selectedType && (
          <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
            <p className={`text-sm font-medium ${listColor}`}>
              {selectedWeek.slice(5)} の週 — {listLabel}（{displayWords.length}語）
            </p>

            {wordLoading ? (
              <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
            ) : displayWords.length === 0 ? (
              <p className="text-slate-400 text-sm">この週のデータはありません</p>
            ) : (
              <div className="space-y-1">
                {displayWords.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => router.push(selectedType === "weak" ? `/weak-word/${w.id}` : `/word/${w.id}`)}
                    className={`w-full flex justify-between items-center py-2 border-b border-slate-100 last:border-0 rounded-lg px-2 -mx-2 transition-colors ${
                      selectedType === "weak" ? "hover:bg-amber-50" :
                      selectedType === "correct" ? "hover:bg-blue-50" :
                      "hover:bg-green-50"
                    }`}
                  >
                    <span className="text-slate-800 text-sm font-medium">{w.word}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">{w.meaning}</span>
                      <span className={`text-xs ${selectedType === "weak" ? "text-amber-400" : selectedType === "correct" ? "text-blue-400" : "text-green-400"}`}>›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {levels.length > 0 && (
          <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-slate-600 text-sm font-medium">レベル別進捗</p>
            <LevelProgress levels={levels} />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-slate-600 text-xs font-medium">グラフの見方</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <div>
                <p className="text-slate-700 text-xs font-medium">正解</p>
                <p className="text-slate-500 text-xs">その週のセッションで正しく答えられた問題の総数</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="text-slate-700 text-xs font-medium">習得単語</p>
                <p className="text-slate-500 text-xs">3回連続正解し、完全に身についたと判定された単語</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <div>
                <p className="text-slate-700 text-xs font-medium">苦手単語</p>
                <p className="text-slate-500 text-xs">2回以上誤答があり、重点的に復習が必要な単語</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
