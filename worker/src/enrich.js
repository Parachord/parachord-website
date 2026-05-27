// Cover-art resolution for Worker request path.
// Ported from smart-links/lib/enrich.js — trimmed to the lookups we need
// (Spotify Client Credentials + iTunes Search). Never throws; returns
// the first image URL it finds, or null.

// --- Spotify Client Credentials ---
let spotifyTokenCache = { token: null, expiresAt: 0 };

async function getSpotifyToken(env) {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) return null;
  if (spotifyTokenCache.token && Date.now() < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token;
  }
  try {
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(env.SPOTIFY_CLIENT_ID + ':' + env.SPOTIFY_CLIENT_SECRET)
      },
      body: 'grant_type=client_credentials'
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    spotifyTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000
    };
    return data.access_token;
  } catch (e) {
    return null;
  }
}

async function searchSpotify(query, token) {
  try {
    const resp = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.tracks?.items || []).map(t => ({
      title: t.name,
      artist: (t.artists || []).map(a => a.name).join(', '),
      album: t.album?.name,
      url: t.external_urls?.spotify,
      albumUrl: t.album?.external_urls?.spotify,
      albumImage: t.album?.images?.[0]?.url
    }));
  } catch (e) {
    return [];
  }
}

// --- iTunes (Apple Music) ---
async function searchItunes(query) {
  try {
    const resp = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.results || []).map(t => ({
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName,
      url: t.trackViewUrl,
      albumUrl: t.collectionViewUrl,
      artworkUrl100: t.artworkUrl100
    }));
  } catch (e) {
    return [];
  }
}

// --- MusicBrainz + Cover Art Archive ---

// MusicBrainz requires a unique User-Agent identifying the app + contact.
// https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
const MB_USER_AGENT = 'parachord-edge/0.1 (+https://parachord.com)';
const MB_BASE = 'https://musicbrainz.org/ws/2';
const CAA_BASE = 'https://coverartarchive.org';

// User-facing `type` → MusicBrainz entity name.
// "album" maps to release-group (the abstract album concept, not a specific
// edition); this matches what link-generators like Achordion produce.
const TYPE_TO_MB_ENTITY = {
  album:           'release-group',
  'release-group': 'release-group',
  release:         'release',
  track:           'recording',
  recording:       'recording',
  artist:          'artist',
};

// Join MusicBrainz artist-credit array honoring per-credit joinphrase.
function formatArtistCredit(credits) {
  if (!Array.isArray(credits)) return '';
  return credits
    .map((c, i) => (c.name || c.artist?.name || '') + (i < credits.length - 1 ? (c.joinphrase || '') : ''))
    .join('')
    .trim();
}

/**
 * Resolve metadata + cover art for a MusicBrainz ID.
 * Returns `{ artist, title, album, coverArtUrl, type }` or null on failure.
 * Never throws.
 */
export async function resolveMbid({ mbid, type }) {
  if (!mbid) return null;
  const resolvedType = type || 'album';
  const entity = TYPE_TO_MB_ENTITY[resolvedType] || 'release-group';

  try {
    const mbResp = await fetch(
      `${MB_BASE}/${entity}/${mbid}?fmt=json&inc=artist-credits`,
      { headers: { 'User-Agent': MB_USER_AGENT } }
    );
    if (!mbResp.ok) return null;
    const data = await mbResp.json();

    // For an artist entity, the entity IS the artist — name is on .name.
    // For releases/recordings/release-groups, artist comes from artist-credit.
    const artist = entity === 'artist'
      ? (data.name || '')
      : formatArtistCredit(data['artist-credit']);
    // Artists use `name`; releases/recordings/release-groups use `title`.
    const title = data.title || data.name || '';
    const album = (entity === 'release-group' || entity === 'release') ? title : undefined;

    // Cover Art Archive only has covers for releases/release-groups.
    // The /front-500 endpoint returns 307 → archive.org direct URL;
    // browsers and og:image crawlers both follow redirects.
    const coverArtUrl = (entity === 'release-group' || entity === 'release')
      ? `${CAA_BASE}/${entity}/${mbid}/front-500`
      : null;

    return { artist, title, album, coverArtUrl, type: resolvedType };
  } catch {
    return null;
  }
}

// --- Public: resolve a single cover-art URL ---
// Runs sources in order, returns the first image URL or null. mbid is
// handled separately via resolveMbid; this function only does text search.
export async function resolveCoverArt({ artist, title, mbid, env }) {
  if (!artist && !title && !mbid) return null;
  const query = [artist, title].filter(Boolean).join(' ');
  if (!query) return null;

  // 1) Spotify
  if (env && env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET) {
    const token = await getSpotifyToken(env);
    if (token) {
      const items = await searchSpotify(query, token);
      const img = items?.[0]?.albumImage;
      if (img) return img;
    }
  }

  // 2) iTunes (no auth)
  const itunes = await searchItunes(query);
  const art = itunes?.[0]?.artworkUrl100;
  if (art) {
    // Upgrade thumbnail to a larger size; mzstatic accepts arbitrary
    // {w}x{h}bb.jpg in the path. Fall through with original if the
    // substitution doesn't match.
    return art.replace(/\/100x100bb\.jpg$/, '/600x600bb.jpg');
  }

  return null;
}
