import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('worker smoke', () => {
  it('responds 200 with body for any GET', async () => {
    const req = new Request('https://parachord.com/');
    const resp = await worker.fetch(req, {}, { waitUntil: () => {}, passThroughOnException: () => {} });
    expect(resp.status).toBe(200);
  });
});
