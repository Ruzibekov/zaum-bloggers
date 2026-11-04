import { describe, expect, it } from "vitest";
import { DEFAULT_SHEET_URL, parsePreference } from "./source-store";

describe("parsePreference", () => {
  it("defaults to the configured Google Sheet", () => {
    expect(parsePreference(null)).toEqual({ kind: "sheet", url: DEFAULT_SHEET_URL });
    expect(parsePreference("not a link")).toEqual({ kind: "sheet", url: DEFAULT_SHEET_URL });
  });

  it("keeps the file snapshot or a user's own sheet", () => {
    const own = "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/edit#gid=0";
    expect(parsePreference("file")).toEqual({ kind: "file" });
    expect(parsePreference(own)).toEqual({ kind: "sheet", url: own });
  });
});
