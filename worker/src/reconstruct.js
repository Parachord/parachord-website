// Recognized `type` words that can appear as the path segment after /play/.
// Single source of truth shared with index.js's normalizePlayTypePath (the
// FORWARD transform: /play/<type> → /play?type=<type>). reconstructDeepLink is
// the INVERSE, so both must agree on the word set.
export const PLAY_TYPE_WORDS = new Set([
  'album', 'track', 'artist', 'release', 'release-group', 'recording',
  'playlist',
]);

export function reconstructDeepLink(url) {
  let pathname = url.pathname;
  let search = url.search;

  // The worker normalizes /play/<type> → /play?type=<type> internally (for
  // template selection + metadata enrichment). The deep link, however, must
  // carry the play sub-action in the PATH (parachord://play/playlist?...),
  // because the desktop and mobile clients read it from the path segment, not
  // from a ?type= query param. Invert the normalization here. Without this the
  // HTTPS bounce emits parachord://play?type=playlist&url=... and clients drop
  // it to a bare single-track play with no usable input. parachord#930.
  if (pathname === '/play') {
    const params = new URLSearchParams(search);
    const type = params.get('type');
    if (type && PLAY_TYPE_WORDS.has(type)) {
      params.delete('type');
      pathname = `/play/${type}`;
      const rest = params.toString();
      search = rest ? `?${rest}` : '';
    }
  }

  const pathAndQuery = pathname.replace(/^\//, '') + search;
  return `parachord://${pathAndQuery}`;
}
