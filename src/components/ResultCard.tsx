"use client";

type Props = {
  correctRate: number;
  wordCount: number;
  newlyMastered: number;
  streakDays: number;
  aiComment: string;
  onHome: () => void;
};

export function ResultCard({ correctRate, wordCount, newlyMastered, streakDays, aiComment, onHome }: Props) {
  const percent = Math.round(correctRate * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 text-center">今日の結果</h1>

      <div className="bg-white rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 text-sm">正答率</span>
          <span className="text-2xl font-bold text-green-600">{percent}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 text-sm">学習単語数</span>
          <span className="text-xl font-semibold text-slate-800">{wordCount}語</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 text-sm">今日習得した単語</span>
          <span className="text-xl font-semibold text-amber-600">
            {newlyMastered > 0 ? `+${newlyMastered}語` : "0語"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 text-sm">累計学習日数</span>
          <span className="text-xl font-semibold text-slate-800">{streakDays}日</span>
        </div>
      </div>

      {aiComment && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-green-700 text-sm leading-relaxed">{aiComment}</p>
        </div>
      )}

      <button
        onClick={onHome}
        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl text-base font-medium transition-colors shadow-sm"
      >
        ホームに戻る
      </button>
    </div>
  );
}
