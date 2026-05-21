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
});
