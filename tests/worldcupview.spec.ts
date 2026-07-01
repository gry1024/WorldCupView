import { expect, test } from "@playwright/test";

test("desktop dashboard exposes every primary WorldCupView section without page scrolling", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "WorldCupView" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "总览" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "对阵图" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "比赛" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "球员" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "球队" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "舆情" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "模拟投注" })).toBeVisible();

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(scrollHeight).toBeLessThanOrEqual(viewportHeight + 8);
});

test("visitors can inspect teams and place a simulated bet", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "球队" }).click();
  await expect(page.getByRole("heading", { name: /国家队全景/ })).toBeVisible();
  await page.getByRole("button", { name: /阿根廷/ }).click();
  await expect(page.getByText(/世界杯履历/)).toBeVisible();

  await page.getByRole("tab", { name: "模拟投注" }).click();
  await expect(page.getByText(/模拟金币/)).toBeVisible();
  await page.getByRole("button", { name: /主胜/ }).first().click();
  await expect(page.getByText(/已下注/)).toBeVisible();
});

test("players section renders real non-cartoon player photos", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "球员" }).click();
  const leaderPhoto = page.locator(".player-leader img").first();

  await expect(leaderPhoto).toBeVisible();
  await expect(leaderPhoto).toHaveAttribute("src", /commons\.wikimedia\.org|upload\.wikimedia\.org/);
  await expect(leaderPhoto).not.toHaveAttribute("src", /dicebear/);
  await expect
    .poll(async () => leaderPhoto.evaluate((image) => (image as HTMLImageElement).naturalWidth), { timeout: 15_000 })
    .toBeGreaterThan(40);
});
