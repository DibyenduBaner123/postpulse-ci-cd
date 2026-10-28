import { describe, it, expect } from 'vitest';
import { validatePost, validateMediaFile } from '../../src/utils/postValidator.ts';

describe('Unit: postValidator & media validation', () => {
  it('fails if no platforms are selected', () => {
    const result = validatePost({
      text: 'Valid text',
      platforms: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'platforms')).toBe(true);
  });

  it('fails if content is completely empty and no media is attached', () => {
    const result = validatePost({
      text: '   ',
      platforms: ['twitter'],
      mediaUrls: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'text')).toBe(true);
  });

  it('passes a normal Twitter post within 280 characters', () => {
    const result = validatePost({
      text: 'Hello world! This is a valid Twitter post under 280 characters.',
      platforms: ['twitter'],
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails a Twitter post exceeding 280 characters', () => {
    const longTweet = 'x'.repeat(281);
    const result = validatePost({
      text: longTweet,
      platforms: ['twitter'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.platform === 'twitter' && e.field === 'text')).toBe(true);
  });

  it('enforces Instagram media requirement (must have at least one image/video)', () => {
    const resultWithoutMedia = validatePost({
      text: 'Aesthetic photo caption without image!',
      platforms: ['instagram'],
      mediaUrls: [],
    });
    expect(resultWithoutMedia.isValid).toBe(false);
    expect(resultWithoutMedia.errors.some((e) => e.platform === 'instagram' && e.field === 'media')).toBe(true);

    const resultWithMedia = validatePost({
      text: 'Aesthetic photo caption with image!',
      platforms: ['instagram'],
      mediaUrls: ['https://example.com/photo.jpg'],
    });
    expect(resultWithMedia.isValid).toBe(true);
  });

  it('enforces platform-specific hashtag limits', () => {
    // Twitter allows 10 hashtags
    const manyTags = Array.from({ length: 12 }, (_, i) => `#tag${i}`).join(' ');
    const result = validatePost({
      text: `Post with too many hashtags: ${manyTags}`,
      platforms: ['twitter'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.platform === 'twitter' && e.field === 'hashtags')).toBe(true);
  });

  it('enforces max media attachment limits (Twitter allows max 4)', () => {
    const result = validatePost({
      text: 'Photos',
      platforms: ['twitter'],
      mediaUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
      ],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.platform === 'twitter' && e.field === 'media')).toBe(true);
  });

  it('rejects scheduled dates that are in the past', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const result = validatePost({
      text: 'Scheduled for past',
      platforms: ['linkedin'],
      scheduledAt: pastDate,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'scheduledAt')).toBe(true);
  });

  it('accepts future scheduled dates', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = validatePost({
      text: 'Scheduled for tomorrow',
      platforms: ['linkedin'],
      scheduledAt: futureDate,
    });
    expect(result.isValid).toBe(true);
  });

  it('validates media file types and size bounds', () => {
    // Valid JPEG
    expect(
      validateMediaFile({
        name: 'photo.jpg',
        type: 'image/jpeg',
        size: 2 * 1024 * 1024,
      }).isValid
    ).toBe(true);

    // Invalid executable / pdf
    const invalidType = validateMediaFile({
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024,
    });
    expect(invalidType.isValid).toBe(false);
    expect(invalidType.error).toContain('Unsupported file type');

    // Oversized (> 5MB)
    const oversized = validateMediaFile({
      name: 'huge.png',
      type: 'image/png',
      size: 6 * 1024 * 1024,
    });
    expect(oversized.isValid).toBe(false);
    expect(oversized.error).toContain('exceeds the maximum allowed limit');
  });
});
