import { describe, expect, it } from "vitest";
import { normalizeWorldCup26, parseScorers, toStage } from "./normalizers";

describe("WorldCup26 data normalization", () => {
  it("parses scorer strings with duplicated names, penalties, and stoppage time", () => {
    const scorers = parseScorers("{\"Kylian Mbappé 14'\",\"Kylian Mbappé 54'\",\"H. Kane 90+4'(p)\"}", "france");

    expect(scorers).toEqual([
      { playerName: "Kylian Mbappé", teamId: "france", minute: 14 },
      { playerName: "Kylian Mbappé", teamId: "france", minute: 54 },
      { playerName: "H. Kane", teamId: "france", minute: 94 },
    ]);
  });

  it("maps tournament stage labels into app stages", () => {
    expect(toStage("group")).toBe("group");
    expect(toStage("r32")).toBe("round32");
    expect(toStage("r16")).toBe("round16");
    expect(toStage("qf")).toBe("quarterfinal");
    expect(toStage("sf")).toBe("semifinal");
    expect(toStage("third")).toBe("third");
    expect(toStage("final")).toBe("final");
  });

  it("normalizes teams and matches into the app data contract", () => {
    const data = normalizeWorldCup26(
      {
        teams: [
          {
            id: "1",
            name_en: "Mexico",
            flag: "https://flagcdn.com/w80/mx.png",
            fifa_code: "MEX",
            iso2: "MX",
            groups: "A",
          },
          {
            id: "2",
            name_en: "Canada",
            flag: "https://flagcdn.com/w80/ca.png",
            fifa_code: "CAN",
            iso2: "CA",
            groups: "A",
          },
        ],
      },
      {
        games: [
          {
            id: "1",
            home_team_id: "1",
            away_team_id: "2",
            home_score: "2",
            away_score: "1",
            home_scorers: "{\"Santiago Gimenez 28'\"}",
            away_scorers: "{\"Jonathan David 76'\"}",
            group: "A",
            matchday: "1",
            local_date: "06/11/2026 20:00",
            stadium_id: "1",
            finished: "TRUE",
            time_elapsed: "finished",
            type: "group",
            home_team_name_en: "Mexico",
            away_team_name_en: "Canada",
          },
        ],
      },
      "2026-07-01T00:00:00.000Z",
    );

    expect(data.teams[0]).toMatchObject({
      id: "mexico",
      name: "墨西哥",
      code: "MEX",
      group: "A",
      flagImage: "https://flagcdn.com/w80/mx.png",
    });
    expect(data.matches[0]).toMatchObject({
      id: "wc26-1",
      stage: "group",
      homeTeamId: "mexico",
      awayTeamId: "canada",
      status: "finished",
      homeScore: 2,
      awayScore: 1,
    });
    expect(data.matches[0].scorers).toHaveLength(2);
  });
});
