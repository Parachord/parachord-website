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

// --- Public: resolve a single cover-art URL ---
// Runs sources in order, returns the first image URL or null. mbid is
// accepted for forward-compat with MusicBrainz/Cover Art Archive but
// is currently unused.
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
