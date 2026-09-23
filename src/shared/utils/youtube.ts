/**
 * YouTube link handling shared by the live-stream validation.
 *
 * A plain `z.string().url()` accepts `https://www.youtube.com/` — a valid URL
 * with no video in it. Such a link was saved as an active live stream and then
 * never appeared on the public site, because the player has no video id to embed.
 * Validating that an id can actually be extracted is what makes "Admin created an
 * active stream -> visitors can see it" true instead of hoped-for.
 */

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

/** True when the string is a URL whose host is a known YouTube domain. */
export const isYouTubeUrl = (raw: string): boolean => {
  try {
    const parsed = new URL(raw.trim());
    return YOUTUBE_HOSTS.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

/**
 * Extracts the video id from any common YouTube link form. Returns `null` when no
 * id is present (never throws), so the caller decides how to report it.
 */
export const extractYouTubeVideoId = (raw: string): string | null => {
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
    return parsed.pathname.replace(/^\/+/, '').split('/')[0] || null;
  }

  if (!hostname.includes('youtube.com')) {
    return null;
  }

  if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/live/')) {
    const id = parsed.pathname.split('/')[2]?.split('/')[0];
    return id || null;
  }

  return parsed.searchParams.get('v') || null;
};

/** Whether the stored link can be embedded (i.e. a video id can be extracted). */
export const canEmbedYouTubeUrl = (raw: string): boolean =>
  isYouTubeUrl(raw) && extractYouTubeVideoId(raw) !== null;
