/** Brand logo URLs for integrations (Simple Icons CDN). */
export const INTEGRATION_LOGOS: Record<string, string> = {
  spotify: "https://cdn.simpleicons.org/spotify/1DB954",
  ableton: "https://cdn.simpleicons.org/ableton/000000",
  "fl-studio": "https://cdn.simpleicons.org/imagej/FF6B00",
  "logic-pro": "https://cdn.simpleicons.org/apple/999999",
  reaper: "https://cdn.simpleicons.org/reaper/CC0000",
  discord: "https://cdn.simpleicons.org/discord/5865F2",
  notion: "https://cdn.simpleicons.org/notion/000000",
  chatgpt: "https://cdn.simpleicons.org/openai/412991",
  midjourney: "https://cdn.simpleicons.org/midjourney/000000",
  bandlab: "https://cdn.simpleicons.org/bandlab/FF0050",
};

export function integrationLogoUrl(id: string): string | null {
  return INTEGRATION_LOGOS[id] ?? null;
}
