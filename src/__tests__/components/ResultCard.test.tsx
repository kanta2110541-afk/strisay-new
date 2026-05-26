import { render, screen } from "@testing-library/react";
import { ResultCard } from "@/components/ResultCard";

const defaultProps = {
  correctRate: 0.8,
  wordCount: 10,
  newlyMastered: 3,
  streakDays: 5,
  aiComment: "よく頑張りました！",
  onHome: jest.fn(),
};

describe("ResultCard", () => {
  // C-07: 正答率が表示される
  test("C-07: 正答率が描画されている", () => {
    render(<ResultCard {...defaultProps} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  // C-08: 学習単語数が表示される
  test("C-08: 学習単語数が描画されている", () => {
    render(<ResultCard {...defaultProps} />);
    expect(screen.getByText("10語")).toBeInTheDocument();
  });

  // C-09: 累計学習日数が表示される
  test("C-09: 累計学習日数が描画されている", () => {
    render(<ResultCard {...defaultProps} />);
    expect(screen.getByText("累計学習日数")).toBeInTheDocument();
    expect(screen.getByText("5日")).toBeInTheDocument();
  });

  // C-10: 今日新たに習得した単語数が表示される
  test("C-10: 新規習得数が描画されている（0件の場合も表示）", () => {
    render(<ResultCard {...defaultProps} newlyMastered={0} />);
    expect(screen.getByText("今日習得した単語")).toBeInTheDocument();
    expect(screen.getByText("0語")).toBeInTheDocument();
  });
});
