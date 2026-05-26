import { render, screen } from "@testing-library/react";
import { LevelProgress } from "@/components/LevelProgress";
import { LevelProgress as LevelProgressType } from "@/types";

const defaultLevels: LevelProgressType[] = [
  { level: 1, mastered: 20, total: 40 },
  { level: 2, mastered: 50, total: 110 },
  { level: 3, mastered: 30, total: 150 },
];

describe("LevelProgress", () => {
  // C-11: Level1・2・3の3本のバーが表示される
  test("C-11: 3つのプログレスバーが描画されている", () => {
    render(<LevelProgress levels={defaultLevels} />);
    expect(screen.getByText("L1 基礎")).toBeInTheDocument();
    expect(screen.getByText("L2 標準")).toBeInTheDocument();
    expect(screen.getByText("L3 発展")).toBeInTheDocument();
  });

  // C-12: 習得数が0の場合
  test("C-12: 習得数が0の場合、エラーにならずバーが描画される", () => {
    const zeroLevels: LevelProgressType[] = [
      { level: 1, mastered: 0, total: 40 },
      { level: 2, mastered: 0, total: 110 },
      { level: 3, mastered: 0, total: 150 },
    ];
    expect(() => render(<LevelProgress levels={zeroLevels} />)).not.toThrow();
    expect(screen.getByText("0 / 40語")).toBeInTheDocument();
    expect(screen.getByText("0 / 110語")).toBeInTheDocument();
    expect(screen.getByText("0 / 150語")).toBeInTheDocument();
  });

  // C-13: 習得数が総数と同じ場合
  test("C-13: 習得数が総数と同じ場合、100%で描画される（エラーにならない）", () => {
    const fullLevels: LevelProgressType[] = [
      { level: 1, mastered: 40, total: 40 },
      { level: 2, mastered: 110, total: 110 },
      { level: 3, mastered: 150, total: 150 },
    ];
    expect(() => render(<LevelProgress levels={fullLevels} />)).not.toThrow();
    expect(screen.getByText("40 / 40語")).toBeInTheDocument();
    expect(screen.getByText("110 / 110語")).toBeInTheDocument();
    expect(screen.getByText("150 / 150語")).toBeInTheDocument();
  });
});
