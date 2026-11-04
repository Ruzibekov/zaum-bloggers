import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and line breaks inside fields", () => {
    const input = '"a","b, c","d ""e"""\r\n"1","2\n3",""\n';
    expect(parseCsv(input)).toEqual([
      ["a", "b, c", 'd "e"'],
      ["1", "2\n3", ""],
    ]);
  });

  it("keeps the last row without a trailing newline and drops blank rows", () => {
    expect(parseCsv("x,y\n\n,\n1,2")).toEqual([
      ["x", "y"],
      ["1", "2"],
    ]);
  });

  it("strips a byte order mark", () => {
    expect(parseCsv("﻿a,b")).toEqual([["a", "b"]]);
  });
});
