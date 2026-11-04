interface ClipboardLike {
  writeText: (text: string) => Promise<void>;
}

export function copyToClipboard(text: string, clipboard: ClipboardLike | undefined = globalThis.navigator?.clipboard): Promise<boolean> {
  if (!clipboard || typeof clipboard.writeText !== "function") return Promise.resolve(false);
  return clipboard.writeText(text).then(
    () => true,
    () => false,
  );
}
