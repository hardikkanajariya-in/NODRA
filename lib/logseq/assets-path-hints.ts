export type ClientPlatform = "windows" | "mac" | "other";

export function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform ?? "").toLowerCase();
  if (platform.includes("win") || ua.includes("windows")) return "windows";
  if (platform.includes("mac") || ua.includes("macintosh")) return "mac";
  return "other";
}

function graphFolderSegment(graphName: string): string {
  const trimmed = graphName.trim();
  return trimmed || "Main";
}

/** Suggested full path shown after linking when the browser cannot expose a real path. */
export function suggestLogseqAssetsPath(graphName: string): string {
  const g = graphFolderSegment(graphName);
  const platform = detectClientPlatform();
  if (platform === "mac") {
    return `~/Library/Application Support/Logseq/graphs/${g}/assets`;
  }
  if (platform === "windows") {
    return `%USERPROFILE%\\logseq\\graphs\\${g}\\assets`;
  }
  return `~/logseq/graphs/${g}/assets`;
}

export function typicalLogseqAssetsPathHints(graphName: string): string[] {
  const g = graphFolderSegment(graphName);
  const platform = detectClientPlatform();
  if (platform === "mac") {
    return [
      `~/Library/Application Support/Logseq/graphs/${g}/assets`,
      `~/logseq/graphs/${g}/assets`,
    ];
  }
  if (platform === "windows") {
    return [`%USERPROFILE%\\logseq\\graphs\\${g}\\assets`];
  }
  return [`~/logseq/graphs/${g}/assets`];
}
