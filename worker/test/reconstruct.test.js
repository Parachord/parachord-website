import { describe, it, expect } from 'vitest';
import { reconstructDeepLink } from '../src/reconstruct.js';

describe('reconstructDeepLink', () => {
  it('strips host and prefixes parachord://', () => {
    const url = new URL('https://parachord.com/play?artist=Radiohead&title=Karma+Police');
    expect(reconstructDeepLink(url)).toBe('parachord://play?artist=Radiohead&title=Karma+Police');
  });

  it('preserves nested path segments', () => {
    const url = new URL('https://parachord.com/artist/radiohead');
    expect(reconstructDeepLink(url)).toBe('parachord://artist/radiohead');
  });

  it('handles paths with no query', () => {
    const url = new URL('https://parachord.com/home');
    expect(reconstructDeepLink(url)).toBe('parachord://home');
  });

  it('preserves multiple query params and special chars', () => {
    const url = new URL('https://parachord.com/chat?prompt=hello%20world&from=share');
    expect(reconstructDeepLink(url)).toBe('parachord://chat?prompt=hello%20world&from=share');
  });

  it('drops leading slash from path', () => {
    const url = new URL('https://parachord.com/play/abc123');
    expect(reconstructDeepLink(url)).toBe('parachord://play/abc123');
  });

  // The worker normalizes /play/<type> → /play?type=<type> internally (for
  // template + enrichment). The reconstructed deep link must invert that back to
  // the PATH form, because the desktop and mobile clients read the play
  // sub-action from the path (parachord://play/playlist?...), NOT from a ?type=
  // query param. parachord#930 — the HTTPS bounce was emitting
  // parachord://play?type=playlist&url=... which clients dropped to a bare
  // single-track play.
  it('lifts a normalized ?type= play sub-action back into the path', () => {
    const url = new URL('https://parachord.com/play?url=https%3A%2F%2Fopen.spotify.com%2Fplaylist%2F37i9dQZF1DXcBWIGoYBM5M&type=playlist');
    expect(reconstructDeepLink(url)).toBe('parachord://play/playlist?url=https%3A%2F%2Fopen.spotify.com%2Fplaylist%2F37i9dQZF1DXcBWIGoYBM5M');
  });

  it('round-trips a path-form playlist input to path-form deep link', () => {
    // /play/playlist?url=X is normalized to /play?url=X&type=playlist before
    // reconstruct sees it; the deep link must come back out as path form.
    const url = new URL('https://parachord.com/play?url=https%3A%2F%2Fachordion.xyz%2Fplaylist%2Fc2accebd-ccd1-42c6-8ce7-ec0e8cf6cd13&type=playlist');
    expect(reconstructDeepLink(url)).toBe('parachord://play/playlist?url=https%3A%2F%2Fachordion.xyz%2Fplaylist%2Fc2accebd-ccd1-42c6-8ce7-ec0e8cf6cd13');
  });

  it('lifts type=album back into the path', () => {
    const url = new URL('https://parachord.com/play?mbid=abc&type=album');
    expect(reconstructDeepLink(url)).toBe('parachord://play/album?mbid=abc');
  });

  it('leaves a bare /play (artist+title, no type) untouched', () => {
    const url = new URL('https://parachord.com/play?artist=Radiohead&title=Karma+Police');
    expect(reconstructDeepLink(url)).toBe('parachord://play?artist=Radiohead&title=Karma+Police');
  });

  it('does not lift an unrecognized type word into the path', () => {
    const url = new URL('https://parachord.com/play?type=bogus&url=https%3A%2F%2Fexample.com');
    expect(reconstructDeepLink(url)).toBe('parachord://play?type=bogus&url=https%3A%2F%2Fexample.com');
  });
});
