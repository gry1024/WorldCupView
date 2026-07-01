import { expect, test } from "@playwright/test";

test("dashboard exposes every primary WorldCupView section and keeps desktop single-screen", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "WorldCupView" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "总览" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "对阵图" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "比赛" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "球员" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "球队" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "舆情" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "模拟投注" })).toBeVisible();

  if (testInfo.project.name === "desktop") {
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(scrollHeight).toBeLessThanOrEqual(viewportHeight + 8);
  }
});

test("mobile layout allows vertical swiping and keeps section controls usable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only scrolling regression.");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "WorldCupView" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const initialScroll = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(initialScroll);

  await page.getByRole("tab", { name: "比赛" }).click();
  await expect(page.getByText("即将进行")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.getByRole("tab", { name: "舆情" }).click();
  await expect(page.getByText("值得关注的全球观点")).toBeVisible();
  await expectNoHorizontalOverflow(page);
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
  await expect(leaderPhoto).toHaveAttribute("src", /player-photos|commons\.wikimedia\.org|upload\.wikimedia\.org/);
  await expect(leaderPhoto).not.toHaveAttribute("src", /dicebear/);
  await expect
    .poll(async () => leaderPhoto.evaluate((image) => (image as HTMLImageElement).naturalWidth), { timeout: 15_000 })
    .toBeGreaterThan(40);
});

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    return scrollWidth - window.innerWidth;
  });

  expect(overflow).toBeLessThanOrEqual(2);
}
