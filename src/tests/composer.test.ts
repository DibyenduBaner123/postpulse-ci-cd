import { describe, it, expect } from 'vitest';
import { PLATFORM_CONFIGS } from '../../server/db';

describe('Multi-Platform Validation Rules', () => {
  it('should enforce 280 character limit on X (Twitter)', () => {
    const config = PLATFORM_CONFIGS.twitter;
    expect(config.characterLimit).toBe(280);

    const validContent = 'A'.repeat(280);
    const invalidContent = 'A'.repeat(281);

    expect(validContent.length <= config.characterLimit).toBe(true);
    expect(invalidContent.length <= config.characterLimit).toBe(false);
  });

  it('should require media attachment for Instagram publishing', () => {
    const config = PLATFORM_CONFIGS.instagram;
    expect(config.mediaRequired).toBe(true);
  });

  it('should support long-form text up to 63,206 chars on Facebook', () => {
    const config = PLATFORM_CONFIGS.facebook;
    expect(config.characterLimit).toBe(63206);
    expect(config.supportsLinks).toBe(true);
  });
});
