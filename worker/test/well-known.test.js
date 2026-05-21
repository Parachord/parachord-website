import { describe, it, expect } from 'vitest';
import { handleAssetLinks } from '../src/well-known.js';

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
