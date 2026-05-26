"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizCard } from "@/components/QuizCard";
import { QuizWord, Word } from "@/types";
import words from "../../../data/toeic_wordlist.json";

export default function StudyPage() {
  const router = useRouter();
  const [quizWords, setQuizWords] = useState<QuizWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ vocabulary_id: number; is_correct: boolean; response_time: number }[]>([]);
  const [newlyMasteredCount, setNewlyMasteredCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily-words")
      .then((r) => r.json())
      .then((data) => {
        setQuizWords(data.words ?? []);
        setLoading(false);
      });
  }, []);

  const handleAnswer = async (isCorrect: boolean, responseTime: number) => {
    const word = quizWords[currentIndex];
    const result = { vocabulary_id: word.id, is_correct: isCorrect, response_time: responseTime };

    const apiRes = await fetch("/api/study-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    }).then((r) => r.json());

    const newResults = [...results, result];
    const newMastered = newlyMasteredCount + (apiRes.is_newly_mastered ? 1 : 0);
    setResults(newResults);
    setNewlyMasteredCount(newMastered);

    if (currentIndex + 1 >= quizWords.length) {
      const correctCount = newResults.filter((r) => r.is_correct).length;
      const correctRate = correctCount / newResults.length;
      const reviewWords = quizWords.map((qw) => {
        const r = newResults.find((res) => res.vocabulary_id === qw.id);
        return { ...qw, is_correct: r?.is_correct ?? false };
      });
      sessionStorage.setItem(
        "study_result",
        JSON.stringify({ correctRate, wordCount: newResults.length, reviewWords, newlyMastered: newMastered })
      );
      router.push("/result");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">単語を準備中...</p>
      </div>
    );
  }

  if (quizWords.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 px-6">
        <p className="text-slate-600">今日の学習は完了しています</p>
        <button onClick={() => router.push("/")} className="text-green-600 text-sm underline">
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      <QuizCard
        word={quizWords[currentIndex]}
        allWords={words as Word[]}
        current={currentIndex + 1}
        total={quizWords.length}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
