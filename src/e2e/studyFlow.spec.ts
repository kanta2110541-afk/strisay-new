import { test, expect } from "@playwright/test";

// E2E 5-1: 学習完了フロー（最重要）
test.describe("学習完了フロー", () => {
  test("5-1: ホーム→学習→結果の一連のフローが動作する", async ({ page }) => {
    // Step 1: アプリを開く
    await page.goto("/");
    await expect(page).toHaveTitle(/Striday/);
    await expect(page.getByText("今日の学習をはじめる")).toBeVisible();

    // Step 2: 「今日の学習」ボタンをタップ
    await page.getByText("今日の学習をはじめる").click();
    await expect(page).toHaveURL("/study");

    // Step 3: 単語が表示される
    await page.waitForSelector("button:has-text('🔊')", { timeout: 10000 });
    const choiceButtons = page.locator("button").filter({ hasNotText: "🔊" });
    await expect(choiceButtons).toHaveCount(4);

    // Step 4〜5: 全問回答する（最大10問）
    let answered = 0;
    const maxQuestions = 10;
    while (answered < maxQuestions) {
      const buttons = page.locator("button").filter({ hasNotText: "🔊" });
      const count = await buttons.count();
      if (count === 0) break;
      await buttons.first().click();
      answered++;
      // 次の問題または結果ページへの遷移を待つ
      try {
        await page.waitForURL("/result", { timeout: 3000 });
        break;
      } catch {
        await page.waitForTimeout(1000);
      }
    }

    // Step 6: 結果画面を確認する
    await page.waitForURL("/result", { timeout: 15000 });
    await expect(page.getByText("今日の結果")).toBeVisible();
    await expect(page.getByText("正答率")).toBeVisible();
    await expect(page.getByText("学習単語数")).toBeVisible();

    // Step 7: ホームに戻る
    await page.getByText("ホームに戻る").click();
    await expect(page).toHaveURL("/");
  });
});
