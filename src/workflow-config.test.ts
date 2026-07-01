import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/hourly-update-deploy.yml"),
  "utf8",
);

describe("hourly update deploy workflow", () => {
  it("pushes refreshed data after the bot commit", () => {
    expect(workflow).toMatch(/worldcupview-bot/);
    expect(workflow).toMatch(/git commit -m "chore: refresh world cup data \[skip ci\]"/);
    expect(workflow).toMatch(
      /git commit -m "chore: refresh world cup data \[skip ci\]"[\s\S]*git push/,
    );
  });

  it("verifies the refreshed site before committing and pushing generated data", () => {
    const verifyIndex = workflow.indexOf("- name: Verify");
    const pushIndex = workflow.indexOf("- name: Commit and push refreshed data");

    expect(verifyIndex).toBeGreaterThan(-1);
    expect(pushIndex).toBeGreaterThan(-1);
    expect(verifyIndex).toBeLessThan(pushIndex);
  });

  it("does not fail when there are no refreshed data changes", () => {
    expect(workflow).toMatch(/git diff --cached --quiet/);
    expect(workflow).toMatch(/git diff --cached --quiet && exit 0/);
  });
});
