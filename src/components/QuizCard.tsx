"use client";

import { useState, useEffect, useCallback } from "react";
import { QuizWord, Word } from "@/types";
import { Progress } from "@/components/ui/progress";

type Props = {
  word: QuizWord;
  allWords: Word[];
  current: number;
  total: number;
  onAnswer: (isCorrect: boolean, responseTime: number) => void;
};

type AnswerState = "unanswered" | "correct" | "incorrect";

export function QuizCard({ word, allWords, current, total, onAnswer }: Props) {
  const [choices, setChoices] = useState<string[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const generateChoices = useCallback(() => {
    const samePos = allWords.filter((w) => w.id !== word.id && w.pos === word.pos);
    const fallback = allWords.filter((w) => w.id !== word.id && w.pos !== word.pos);
    const pool = samePos.length >= 3 ? samePos : [...samePos, ...fallback];
    const wrongChoices = pool
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.meaning);
    const all = [...wrongChoices, word.meaning].sort(() => Math.random() - 0.5);
    setChoices(all);
    setAnswerState("unanswered");
    setSelectedChoice(null);
    setStartTime(Date.now());
  }, [word, allWords]);

  useEffect(() => {
    generateChoices();
  }, [generateChoices]);

  const speakWord = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const handleChoice = (choice: string) => {
    if (answerState !== "unanswered") return;
    const responseTime = Date.now() - startTime;
    const isCorrect = choice === word.meaning;
    setSelectedChoice(choice);
    setAnswerState(isCorrect ? "correct" : "incorrect");
    setTimeout(() => onAnswer(isCorrect, responseTime), 800);
  };

  const getChoiceStyle = (choice: string) => {
    if (answerState === "unanswered") {
      return "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm";
    }
    if (choice === word.meaning) {
      return "bg-green-100 text-green-800 border border-green-400";
    }
    if (choice === selectedChoice && choice !== word.meaning) {
      return "bg-red-50 text-red-600 border border-red-300";
    }
    return "bg-white text-slate-400 border border-slate-200";
  };

  return (
    <div className="flex flex-col h-full px-4 py-6 space-y-6">
      <Progress value={(current / total) * 100} className="h-1.5 bg-slate-200" />

      <div className="text-slate-400 text-sm text-right">
        {current} / {total}
      </div>

      <div
        className={`flex-1 flex flex-col items-center justify-center rounded-2xl p-8 space-y-4 ${
          word.is_weak ? "bg-amber-50 border border-amber-200" : "bg-white shadow-sm"
        }`}
      >
        {word.is_weak && (
          <span className="text-amber-600 text-xs">復習中</span>
        )}
        <p className="text-4xl font-bold text-slate-800 tracking-wide">{word.word}</p>
        <p className="text-slate-400 text-sm">{word.pos}</p>
        <button
          onClick={() => speakWord(word.word)}
          className="mt-2 text-slate-400 hover:text-green-600 transition-colors"
          aria-label="音声再生"
        >
          🔊
        </button>
      </div>

      <div className="space-y-3">
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleChoice(choice)}
            disabled={answerState !== "unanswered"}
            className={`w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all duration-200 ${getChoiceStyle(choice)}`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
