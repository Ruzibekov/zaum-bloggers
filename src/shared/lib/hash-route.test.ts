import { describe, expect, it } from "vitest";
import { buildHash, parseHash } from "./hash-route";

describe("hash route", () => {
  it("parses a blogger card link with the calendar view", () => {
    expect(parseHash("#/b/%D0%91%D0%BB%D0%BE%D0%B3%D0%B5%D1%80%20007?view=calendar")).toEqual({
      blogger: "Блогер 007",
      view: "calendar",
    });
  });

  it("falls back to the list view and no card", () => {
    expect(parseHash("")).toEqual({ blogger: null, view: "list" });
    expect(parseHash("#/?view=board")).toEqual({ blogger: null, view: "list" });
    expect(parseHash("#/b/   ")).toEqual({ blogger: null, view: "list" });
  });

  it("survives malformed encoding", () => {
    expect(parseHash("#/b/%E0%A4%A")).toEqual({ blogger: null, view: "list" });
  });

  it("round-trips names with spaces and slashes", () => {
    const route = { blogger: "Блогер 1/2 и ко", view: "calendar" as const };
    expect(parseHash(buildHash(route))).toEqual(route);
    expect(buildHash({ blogger: null, view: "list" })).toBe("#/");
  });
});
