"use client";

import { DailyStat } from "@/types";

type Props = { stats: DailyStat[]; year: number; month: number };

function getDayColor(stat: DailyStat | undefined): string {
  if (!stat) return "bg-slate-800";
  if (stat.word_count < 10) return "bg-green-900";
  return "bg-green-600";
}

export function CalendarView({ stats, year, month }: Props) {
  const statMap = new Map(stats.map((s) => [s.study_date, s]));
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 text-center text-xs text-slate-500 mb-1">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const stat = statMap.get(dateStr);
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          return (
            <div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center text-xs ${getDayColor(stat)} ${isToday ? "ring-1 ring-green-400" : ""}`}
            >
              <span className={stat ? "text-white font-medium" : "text-slate-500"}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
