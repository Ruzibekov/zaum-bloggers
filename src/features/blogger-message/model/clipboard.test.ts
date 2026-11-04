import { describe, expect, it } from "vitest";
import { copyToClipboard } from "./clipboard";

describe("copyToClipboard", () => {
  it("writes the text and reports success", async () => {
    const written: string[] = [];
    const ok = await copyToClipboard("Здравствуйте!", { writeText: async (text) => void written.push(text) });
    expect(ok).toBe(true);
    expect(written).toEqual(["Здравствуйте!"]);
  });

  it("reports failure when the browser denies access", async () => {
    const denied = { writeText: () => Promise.reject(new DOMException("denied", "NotAllowedError")) };
    expect(await copyToClipboard("текст", denied)).toBe(false);
  });

  it("reports failure when the Clipboard API is missing", async () => {
    expect(await copyToClipboard("текст", undefined)).toBe(false);
  });
});
