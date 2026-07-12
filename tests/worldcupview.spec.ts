import { expect, test } from "@playwright/test";

test("dashboard exposes every primary WorldCupView section and keeps desktop single-screen", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "WorldCupView" })).toBeVisible();
  await expect(page.locator(".nav-tab")).toHaveCount(7);
  await expectTabsContained(page);
  await expectNoHorizontalOverflow(page);

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

  await switchToSection(page, 2);
  await expect(page.locator(".matches-grid")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await switchToSection(page, 5);
  await expect(page.locator(".pulse-grid")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("desktop match columns scroll internally when their content exceeds the available height", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop-only match column scrolling regression.");

  await page.goto("/");
  await switchToSection(page, 2);

  const columns = page.locator(".match-column");
  await expect(columns.first()).toBeVisible();

  const columnStates = await columns.evaluateAll((elements) =>
    elements.map((element) => {
      const style = window.getComputedStyle(element);
      return {
        canScrollWhenOverflowing:
          element.scrollHeight <= element.clientHeight + 1 || ["auto", "scroll"].includes(style.overflowY),
        clientHeight: element.clientHeight,
        overflowY: style.overflowY,
        scrollHeight: element.scrollHeight,
      };
    }),
  );

  expect(columnStates).toHaveLength(3);
  for (const state of columnStates) {
    expect(state.canScrollWhenOverflowing, JSON.stringify(state)).toBe(true);
  }
});

test("section tabs stay inside the viewport and tab rail on desktop and mobile", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".nav-tab")).toHaveCount(7);
  await expectTabsContained(page);
  await expectNoHorizontalOverflow(page);
});

test("visitors can inspect teams and place a simulated bet", async ({ page }) => {
  await page.goto("/");

  await switchToSection(page, 4);
  await expect(page.locator(".teams-grid")).toBeVisible();
  await page.locator(".team-button").nth(1).click();
  await expect(page.locator(".team-button.selected")).toHaveCount(1);
  await expect(page.locator(".team-detail")).toBeVisible();

  await switchToSection(page, 6);
  await expect(page.locator(".wallet-balance")).toBeVisible();
  const historyRows = page.locator(".bet-history > div");
  const initialHistoryCount = await historyRows.count();
  await page.locator(".odds-row button").first().click();
  await expect(historyRows).toHaveCount(initialHistoryCount + 1);
});



test("players, matches, and pulse panels expose real selectable detail states", async ({ page }) => {
  await page.goto("/");

  await switchToSection(page, 3);
  const leaderName = page.locator(".player-leader h2");
  const secondScorer = page.locator(".scorer-row").nth(1);
  const secondName = await secondScorer.locator("strong").innerText();
  await secondScorer.click();
  await expect(secondScorer).toHaveAttribute("aria-pressed", "true");
  await expect(leaderName).toHaveText(secondName);

  await switchToSection(page, 2);
  const secondMatch = page.locator(".match-card").nth(1);
  await secondMatch.click();
  await expect(secondMatch).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".match-detail-card")).toContainText("比赛详报");

  await switchToSection(page, 5);
  const secondSignal = page.locator(".support-cell").nth(1);
  await secondSignal.click();
  await expect(secondSignal).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".pulse-detail")).toContainText("社媒情绪详情");
});

test("players section renders real non-cartoon player photos", async ({ page }) => {
  await page.goto("/");

  await switchToSection(page, 3);
  const leaderPhoto = page.locator(".player-leader img").first();

  await expect(leaderPhoto).toBeVisible();
  await expect(leaderPhoto).toHaveAttribute("src", /player-photos|commons\.wikimedia\.org|upload\.wikimedia\.org/);
  await expect(leaderPhoto).not.toHaveAttribute("src", /dicebear/);
  await expect
    .poll(async () => leaderPhoto.evaluate((image) => (image as HTMLImageElement).naturalWidth), { timeout: 15_000 })
    .toBeGreaterThan(40);
});

async function switchToSection(page: import("@playwright/test").Page, index: number) {
  const tab = page.locator(".nav-tab").nth(index);
  await expect
    .poll(
      async () => {
        await tab.click({ timeout: 1_000 });
        return tab.getAttribute("aria-selected");
      },
      { timeout: 10_000 },
    )
    .toBe("true");
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    return scrollWidth - window.innerWidth;
  });

  expect(overflow).toBeLessThanOrEqual(2);
}

async function expectTabsContained(page: import("@playwright/test").Page) {
  const tabOverflow = await page.evaluate(() => {
    const tabs = document.querySelector<HTMLElement>(".wcv-tabs");
    if (!tabs) {
      return [{ error: "missing .wcv-tabs" }];
    }

    const viewportWidth = window.innerWidth;
    const rail = tabs.getBoundingClientRect();
    return Array.from(tabs.querySelectorAll<HTMLElement>(".nav-tab")).map((tab, index) => {
      const rect = tab.getBoundingClientRect();
      return {
        index,
        leftViewportOverflow: Math.max(0, -rect.left),
        rightViewportOverflow: Math.max(0, rect.right - viewportWidth),
        leftRailOverflow: Math.max(0, rail.left - rect.left),
        rightRailOverflow: Math.max(0, rect.right - rail.right),
      };
    });
  });

  for (const tab of tabOverflow) {
    expect(tab, JSON.stringify(tab)).toMatchObject({
      leftRailOverflow: 0,
      leftViewportOverflow: 0,
      rightRailOverflow: 0,
      rightViewportOverflow: 0,
    });
  }
}
