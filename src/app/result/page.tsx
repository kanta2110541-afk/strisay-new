"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultCard } from "@/components/ResultCard";
import { WordReviewList } from "@/components/WordReviewList";
import { Word } from "@/types";

type ReviewWord = Word & { is_correct: boolean };
type Examples = Record<string, { en: string; ja: string }>;

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<{ correctRate: number; wordCount: number } | null>(null);
  const [reviewWords, setReviewWords] = useState<ReviewWord[]>([]);
  const [aiComment, setAiComment] = useState("");
  const [streakDays, setStreakDays] = useState(0);
  const [newlyMastered, setNewlyMastered] = useState(0);
  const [examples, setExamples] = useState<Examples>({});
  const [loadingExamples, setLoadingExamples] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("study_result");
    if (!stored) { router.push("/"); return; }
    const result = JSON.parse(stored);
    setData(result);
    setReviewWords(result.reviewWords ?? []);

    const storedNewlyMastered = result.newlyMastered ?? 0;
    setNewlyMastered(storedNewlyMastered);

    fetch("/api/streak")
      .then((r) => r.json())
      .then((streakData) => {
        const streak = streakData.streak_days ?? 0;
        setStreakDays(streak);
        return fetch("/api/ai-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streak_days: streak,
            correct_rate: result.correctRate,
            word_count: result.wordCount,
            weak_word_count: 0,
            newly_mastered: storedNewlyMastered,
          }),
        }).then((r) => r.json());
      })
      .then((commentData) => {
        setAiComment(commentData.comment ?? "");
      })
      .catch(() => {});

    if (result.reviewWords?.length) {
      const wordInputs = result.reviewWords.map((w: ReviewWord) => ({
        id: w.id,
        word: w.word,
        pos: w.pos,
        meaning: w.meaning,
        example_scene: w.example_scene,
      }));
      fetch("/api/word-examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: wordInputs }),
      })
        .then((r) => r.json())
        .then((data) => setExamples(data.examples ?? {}))
        .catch(() => {})
        .finally(() => setLoadingExamples(false));
    } else {
      setLoadingExamples(false);
    }
  }, [router]);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <ResultCard
          correctRate={data.correctRate}
          wordCount={data.wordCount}
          newlyMastered={newlyMastered}
          streakDays={streakDays}
          aiComment={aiComment}
          onHome={() => router.push("/")}
        />

        {reviewWords.length > 0 && (
          <WordReviewList
            words={reviewWords}
            examples={examples}
            loadingExamples={loadingExamples}
          />
        )}
      </div>
    </div>
  );
}
