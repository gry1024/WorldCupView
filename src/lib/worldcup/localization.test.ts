import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import worldCupData from "../../data/worldcup-data.json";
import { rankTopScorers } from "./analytics";
import { getPlayerProfile, toChineseNewsTitle } from "./localization";

describe("Chinese localization and real player photos", () => {
  it("converts English news titles into Chinese dashboard copy", () => {
    const title = toChineseNewsTitle("Pick your perfect World Cup 2026 group stage match", "BBC Sport");

    expect(title).toContain("世界杯");
    expect(title).toContain("BBC Sport");
    expect(title).not.toContain("Pick your perfect");
  });

  it("uses Chinese player names and real photo URLs for famous players", () => {
    const profile = getPlayerProfile("Lionel Messi");

    expect(profile.displayName).toBe("梅西");
    expect(profile.photoUrl).toContain("/player-photos/lionel-messi-20260701.jpg");
    expect(profile.photoUrl).not.toContain("dicebear");
    expect(profile.photoCredit).toContain("Wikimedia Commons");
  });

  it("labels unknown player names in Chinese instead of showing bare English UI text", () => {
    const profile = getPlayerProfile("Example Forward");

    expect(profile.displayName).toBe("外文名：Example Forward");
    expect(profile.photoUrl).not.toContain("dicebear");
  });

  it("repairs common feed abbreviations before rendering scorer names", () => {
    expect(getPlayerProfile("K. Mbappé").displayName).toBe("姆巴佩");
    expect(getPlayerProfile("J. Quiñones").displayName).toBe("胡利安·基尼奥内斯");
  });
  it("uses existing local real photos for the top 10 scorer avatars", () => {
    const topScorers = rankTopScorers(worldCupData, 10);

    expect(topScorers).toHaveLength(10);

    for (const player of topScorers) {
      expect(player.image, player.name).toMatch(/^\/player-photos\/[^/]+\.(?:jpe?g|png|webp)$/);
      expect(player.image, player.name).toContain("-20260701.");
      expect(player.image, player.name).not.toMatch(/(?:commons|upload)\.wikimedia\.org/);
      expect(
        existsSync(path.join(process.cwd(), "public", player.image)),
        `${player.name} should have a local photo at ${player.image}`,
      ).toBe(true);
    }
  });
});
