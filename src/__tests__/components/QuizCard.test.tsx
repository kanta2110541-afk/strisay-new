import { render, screen, fireEvent } from "@testing-library/react";
import { QuizCard } from "@/components/QuizCard";
import { QuizWord, Word } from "@/types";

const mockWord: QuizWord = {
  id: 1,
  word: "accomplish",
  pos: "動詞",
  meaning: "達成する",
  level: 1,
  example_scene: "ビジネス",
  is_weak: false,
};

const allWords: Word[] = [
  { id: 1, word: "accomplish", pos: "動詞", meaning: "達成する", level: 1, example_scene: "ビジネス" },
  { id: 2, word: "negotiate", pos: "動詞", meaning: "交渉する", level: 1, example_scene: "ビジネス" },
  { id: 3, word: "strategy", pos: "名詞", meaning: "戦略", level: 1, example_scene: "ビジネス" },
  { id: 4, word: "deadline", pos: "名詞", meaning: "締め切り", level: 1, example_scene: "ビジネス" },
  { id: 5, word: "budget", pos: "名詞", meaning: "予算", level: 1, example_scene: "ビジネス" },
];

const mockOnAnswer = jest.fn();

describe("QuizCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.speechSynthesis = { speak: jest.fn(), cancel: jest.fn() } as unknown as SpeechSynthesis;
  });

  // C-01: 英単語が表示される
  test("C-01: 英単語が画面に描画されている", () => {
    render(<QuizCard word={mockWord} allWords={allWords} current={1} total={10} onAnswer={mockOnAnswer} />);
    expect(screen.getByText("accomplish")).toBeInTheDocument();
  });

  // C-02: 選択肢が4つ表示される
  test("C-02: 選択肢ボタンが4つ描画されている", () => {
    render(<QuizCard word={mockWord} allWords={allWords} current={1} total={10} onAnswer={mockOnAnswer} />);
    const buttons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent !== "🔊"
    );
    expect(buttons.length).toBe(4);
  });

  // C-03: 正解を選択した場合
  test("C-03: 正解を選択した場合、正解フィードバックが表示される", () => {
    render(<QuizCard word={mockWord} allWords={allWords} current={1} total={10} onAnswer={mockOnAnswer} />);
    const correctButton = screen.getByText("達成する");
    fireEvent.click(correctButton);
    expect(correctButton).toHaveClass("bg-green-100");
  });

  // C-04: 不正解を選択した場合
  test("C-04: 不正解を選択した場合、不正解フィードバックと正解が表示される", () => {
    render(<QuizCard word={mockWord} allWords={allWords} current={1} total={10} onAnswer={mockOnAnswer} />);
    const buttons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent !== "🔊" && btn.textContent !== "達成する"
    );
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveClass("bg-red-50");
    expect(screen.getByText("達成する")).toHaveClass("bg-green-100");
  });

  // C-05: 苦手単語の場合
  test("C-05: is_weak=true の場合、黄色背景が適用されている", () => {
    const weakWord = { ...mockWord, is_weak: true };
    render(<QuizCard word={weakWord} allWords={allWords} current={1} total={10} onAnswer={mockOnAnswer} />);
    expect(screen.getByText("復習中")).toBeInTheDocument();
    const card = screen.getByText("accomplish").closest("div");
    expect(card).toHaveClass("bg-amber-50");
  });

  // C-06: 回答後に選択肢がロックされる
  test("C-06: 回答後は他の選択肢ボタンが disabled になる", () => {
    render(<QuizCard word={mockWord} allWords={allWords} current={1} total={10} onAnswer={mockOnAnswer} />);
    const allButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent !== "🔊"
    );
    fireEvent.click(allButtons[0]);
    allButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
