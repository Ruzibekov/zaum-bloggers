export type ListView = "list" | "calendar";

export interface HashRoute {
  blogger: string | null;
  view: ListView;
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    if (error instanceof URIError) return null;
    throw error;
  }
}

export function parseHash(hash: string): HashRoute {
  const raw = hash.replace(/^#/, "");
  const [path = "", query = ""] = raw.split("?");
  const segments = path.split("/").filter(Boolean);
  let blogger: string | null = null;
  if (segments[0] === "b" && segments[1]) {
    const decoded = safeDecode(segments.slice(1).join("/"));
    blogger = decoded && decoded.trim() ? decoded.trim() : null;
  }
  const view = new URLSearchParams(query).get("view") === "calendar" ? "calendar" : "list";
  return { blogger, view };
}

export function buildHash(route: HashRoute): string {
  const path = route.blogger ? `/b/${encodeURIComponent(route.blogger)}` : "/";
  const query = route.view === "calendar" ? "?view=calendar" : "";
  return `#${path}${query}`;
}
