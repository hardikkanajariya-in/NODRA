import { describe, it, expect } from "vitest";
import {
  collectAssetFileCandidates,
  normalizeAssetReference,
} from "./local-asset-folder";

describe("normalizeAssetReference", () => {
  it("takes basename from assets paths", () => {
    expect(normalizeAssetReference("../assets/photo.png")).toBe("photo.png");
    expect(normalizeAssetReference("assets/foo.jpg")).toBe("foo.jpg");
  });

  it("strips file URLs to basename", () => {
    expect(
      normalizeAssetReference("file:///C:/logseq/graphs/g/assets/x.png"),
    ).toBe("x.png");
  });

  it("keeps timestamp hints", () => {
    expect(normalizeAssetReference("2026-09-19-22-24-09")).toBe(
      "2026-09-19-22-24-09",
    );
  });
});

describe("collectAssetFileCandidates", () => {
  it("adds extension variants for hints without extension", () => {
    const names = collectAssetFileCandidates("2026-09-19-22-24-09");
    expect(names[0]).toBe("2026-09-19-22-24-09");
    expect(names).toContain("2026-09-19-22-24-09.png");
    expect(names).toContain("2026-09-19-22-24-09.jpg");
  });

  it("merges hint and markdown url", () => {
    const names = collectAssetFileCandidates(
      "ignored",
      "../assets/screenshot.png",
    );
    expect(names).toContain("screenshot.png");
  });
});
