import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const publishScript = readFileSync(
  resolve(process.cwd(), "scripts/publish-after-login.ps1"),
  "utf8",
);

describe("publish-after-login script", () => {
  it("writes GitHub secrets without stdin pipeline newlines", () => {
    expect(publishScript).toMatch(
      /gh secret set TCB_ENV_ID --repo \$repoFullName --body \$tcbEnvId/,
    );
    expect(publishScript).toMatch(
      /gh secret set TCB_CLOUDBASE_API_KEY --repo \$repoFullName --body \$tcbCloudBaseApiKey/,
    );
    expect(publishScript).not.toMatch(/\$tcbEnvId\s*\|\s*gh secret set/);
    expect(publishScript).not.toMatch(/\$tcbCloudBaseApiKey\s*\|\s*gh secret set/);
  });

  it("updates the Chinese README URL header instead of the old mojibake header", () => {
    expect(publishScript).toMatch(/StartsWith\("网址："\)/);
    expect(publishScript).not.toMatch(/缃戝潃/);
  });
});
