import { describe, it, expect } from 'vitest';
import { handleAssetLinks, handleAasa } from '../src/well-known.js';

describe('handleAssetLinks', () => {
  it('returns 200 with application/json', async () => {
    const resp = handleAssetLinks();
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('declares both release and debug package names', async () => {
    const resp = handleAssetLinks();
    const body = await resp.json();
    const pkgs = body.map(entry => entry.target.package_name);
    expect(pkgs).toContain('com.parachord.android');
    expect(pkgs).toContain('com.parachord.android.debug');
  });

  it('every entry uses handle_all_urls relation', async () => {
    const resp = handleAssetLinks();
    const body = await resp.json();
    for (const entry of body) {
      expect(entry.relation).toEqual(['delegate_permission/common.handle_all_urls']);
      expect(entry.target.namespace).toBe('android_app');
      expect(Array.isArray(entry.target.sha256_cert_fingerprints)).toBe(true);
      expect(entry.target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
    }
  });

  it('sets a 1-hour cache header', () => {
    const resp = handleAssetLinks();
    expect(resp.headers.get('cache-control')).toBe('public, max-age=3600');
  });
});

describe('handleAasa', () => {
  it('returns 200 with application/json', async () => {
    const resp = handleAasa();
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toMatch(/^application\/json/);
  });

  it('ships with empty appIDs until iOS lands', async () => {
    const resp = handleAasa();
    const body = await resp.json();
    expect(body.applinks.details[0].appIDs).toEqual([]);
  });

  it('declares every verb from issue #78 components list', async () => {
    const resp = handleAasa();
    const body = await resp.json();
    const components = body.applinks.details[0].components;
    const pathsDeclared = components.map(c => c['/']);
    const expectedPaths = [
      '/play', '/play/*', '/listen-along', '/import',
      '/queue/*', '/control/*', '/shuffle/*', '/volume/*',
      '/artist/*', '/album/*', '/playlist/*', '/library*', '/history*',
      '/friend/*', '/recommendations*', '/playlists', '/charts', '/critics-picks',
      '/settings*', '/search', '/chat', '/home'
    ];
    for (const p of expectedPaths) expect(pathsDeclared).toContain(p);
  });

  it('sets cache header', () => {
    const resp = handleAasa();
    expect(resp.headers.get('cache-control')).toBe('public, max-age=3600');
  });
});
