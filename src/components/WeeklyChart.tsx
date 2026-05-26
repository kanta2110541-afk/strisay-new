"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { WeeklyStat } from "@/types";

type SelectionType = "mastered" | "weak" | "correct";

type Props = {
  weeks: WeeklyStat[];
  selectedWeek?: string;
  selectedType?: SelectionType;
  onBarClick?: (week: string, type: SelectionType) => void;
};

export function WeeklyChart({ weeks, selectedWeek, selectedType, onBarClick }: Props) {
  if (weeks.length === 0) return null;

  const data = weeks.map((w) => ({
    week: w.week.slice(5),
    weekFull: w.week,
    正解: w.correct_count,
    習得: w.mastered_count,
    苦手: w.weak_count,
  }));

  const handleBarClick = (type: SelectionType) => (barData: { weekFull?: string }) => {
    if (onBarClick && barData.weekFull) onBarClick(barData.weekFull, type);
  };

  const isSelected = (weekFull: string, type: SelectionType) =>
    selectedWeek === weekFull && selectedType === type;

  return (
    <div className="space-y-2">
      <p className="text-slate-500 text-xs">
        週別 正解数 / 習得単語 / 苦手単語
        {onBarClick && <span className="ml-1 text-slate-400">（バーをタップして確認）</span>}
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="正解" radius={[4, 4, 0, 0]} onClick={handleBarClick("correct")} style={{ cursor: "pointer" }}>
            {data.map((entry) => (
              <Cell
                key={entry.weekFull + "-correct"}
                fill={isSelected(entry.weekFull, "correct") ? "#2563eb" : "#60a5fa"}
                opacity={selectedWeek && !isSelected(entry.weekFull, "correct") ? 0.4 : 1}
              />
            ))}
          </Bar>
          <Bar dataKey="習得" radius={[4, 4, 0, 0]} onClick={handleBarClick("mastered")} style={{ cursor: "pointer" }}>
            {data.map((entry) => (
              <Cell
                key={entry.weekFull + "-mastered"}
                fill={isSelected(entry.weekFull, "mastered") ? "#15803d" : "#16a34a"}
                opacity={selectedWeek && !isSelected(entry.weekFull, "mastered") ? 0.4 : 1}
              />
            ))}
          </Bar>
          <Bar dataKey="苦手" radius={[4, 4, 0, 0]} onClick={handleBarClick("weak")} style={{ cursor: "pointer" }}>
            {data.map((entry) => (
              <Cell
                key={entry.weekFull + "-weak"}
                fill={isSelected(entry.weekFull, "weak") ? "#d97706" : "#f59e0b"}
                opacity={selectedWeek && !isSelected(entry.weekFull, "weak") ? 0.4 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
