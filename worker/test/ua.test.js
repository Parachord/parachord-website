import { describe, it, expect } from 'vitest';
import { storeCtaForUserAgent } from '../src/ua.js';

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15';
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15';

describe('storeCtaForUserAgent', () => {
  it('routes Android to Play Store with referrer', () => {
    const cta = storeCtaForUserAgent(ANDROID_UA, 'parachord://play?title=X');
    expect(cta.href).toMatch(/^https:\/\/play\.google\.com\/store\/apps\/details/);
    expect(cta.href).toContain('id=com.parachord.android');
    expect(cta.href).toContain('referrer=');
    expect(decodeURIComponent(cta.href.split('referrer=')[1])).toBe('parachord://play?title=X');
    expect(cta.label).toMatch(/Get Parachord/i);
  });

  it('routes iOS to /apps placeholder until App Store URL exists', () => {
    const cta = storeCtaForUserAgent(IOS_UA, 'parachord://play');
    expect(cta.href).toBe('https://parachord.com/apps');
  });

  it('routes desktop to /apps', () => {
    const cta = storeCtaForUserAgent(DESKTOP_UA, 'parachord://play');
    expect(cta.href).toBe('https://parachord.com/apps');
  });

  it('handles missing UA gracefully', () => {
    const cta = storeCtaForUserAgent('', 'parachord://play');
    expect(cta.href).toBe('https://parachord.com/apps');
  });

  it('handles iPad', () => {
    const ipad = 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X)';
    expect(storeCtaForUserAgent(ipad, 'parachord://play').href).toBe('https://parachord.com/apps');
  });
});
