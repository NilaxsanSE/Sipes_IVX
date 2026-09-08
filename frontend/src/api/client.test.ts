import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './client';

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats backend validation errors clearly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: [
            {
              loc: ['path', 'object_id'],
              msg: 'Input should be a valid UUID',
            },
          ],
        }),
        { status: 422 },
      ),
    );

    await expect(apiRequest('/api/objects/not-a-valid-id')).rejects.toThrow(
      'object_id: Input should be a valid UUID',
    );
  });
});
