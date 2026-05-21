import { describe, it, expect } from 'vitest';
import { classifyPath } from '../src/dispatch.js';

describe('classifyPath', () => {
  // Template A — generic
  it.each([
    '/home', '/library', '/library/saved',
    '/history', '/charts', '/critics-picks',
    '/playlists', '/recommendations', '/settings', '/settings/account',
    '/chat', '/search'
  ])('classifies %s as template A', (p) => {
    expect(classifyPath(p)).toBe('A');
  });

  // Template B — verb-with-query
  it.each([
    '/play', '/listen-along', '/import',
    '/queue/foo', '/control/play', '/shuffle/on', '/volume/50',
    '/friend/jess'
  ])('classifies %s as template B', (p) => {
    expect(classifyPath(p)).toBe('B');
  });

  // Template C — entity
  it.each([
    '/artist/radiohead', '/album/abc', '/playlist/xyz',
    '/play/track-id-123'
  ])('classifies %s as template C', (p) => {
    expect(classifyPath(p)).toBe('C');
  });

  // Passthrough — anything not on the list
  it.each([
    '/', '/blog/2026/05/foo/', '/assets/home.png',
    '/post-that-doesnt-exist'
  ])('classifies %s as passthrough', (p) => {
    expect(classifyPath(p)).toBe('passthrough');
  });
});
