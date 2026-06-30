import { expect, test } from "@playwright/test";

test("visual smoke captures the WorldCupView dashboard", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "WorldCupView" })).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  await expect(page.getByRole("tabpanel")).toContainText("全局焦点");

  await page.screenshot({
    path: testInfo.outputPath("worldcupview-dashboard.png"),
    fullPage: false,
  });
});
