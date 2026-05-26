"use client";

import { Progress } from "@/components/ui/progress";
import { LevelProgress as LevelProgressType } from "@/types";

type Props = { levels: LevelProgressType[] };

const LEVEL_LABELS = { 1: "L1 基礎", 2: "L2 標準", 3: "L3 発展" };

export function LevelProgress({ levels }: Props) {
  return (
    <div className="space-y-3">
      {levels.map((lv) => {
        const pct = lv.total === 0 ? 0 : Math.round((lv.mastered / lv.total) * 100);
        return (
          <div key={lv.level} className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{LEVEL_LABELS[lv.level]}</span>
              <span>{lv.mastered} / {lv.total}語</span>
            </div>
            <Progress value={pct} className="h-2 bg-slate-700" />
          </div>
        );
      })}
    </div>
  );
}
