import { describe, it, expect } from 'vitest';
import { countCharacters, extractHashtags, calculateRemainingChars } from '../../src/utils/characterCount.ts';

describe('Unit: characterCount & hashtag utility', () => {
  it('correctly counts basic ASCII strings', () => {
    expect(countCharacters('Hello World')).toBe(11);
    expect(countCharacters('')).toBe(0);
  });

  it('correctly counts multi-byte emojis as single grapheme characters', () => {
    // Emojis: rocket (🚀), party (🎉), fire (🔥)
    const text = 'Launch day! 🚀🎉🔥';
    // "Launch day! " is 12 chars + 3 emojis = 15 graphemes
    expect(countCharacters(text)).toBe(15);
  });

  it('calculates Twitter t.co 23-character wrapped URL limits', () => {
    const textWithUrl = 'Check out our new site https://example.com/very/long/url/path/that/exceeds/standard/length today!';
    // "Check out our new site " = 23 chars
    // " today!" = 7 chars
    // URL = 23 chars (standard Twitter shortener t.co)
    // Total = 23 + 23 + 7 = 53
    const count = countCharacters(textWithUrl, 'twitter');
    expect(count).toBe(53);
  });

  it('handles multiple URLs on Twitter correctly', () => {
    const text = 'Link1: https://a.com Link2: https://b.com/long';
    // "Link1: " (7) + 23 + " Link2: " (8) + 23 = 61
    expect(countCharacters(text, 'twitter')).toBe(61);
  });

  it('extracts unique and lowercase hashtags correctly', () => {
    const text = 'Excited for #DevOps and #CICD with #Docker and #devops!';
    const tags = extractHashtags(text);
    expect(tags).toEqual(['#devops', '#cicd', '#docker', '#devops']);
  });

  it('returns empty array when text has no hashtags', () => {
    expect(extractHashtags('Plain message with no tags')).toEqual([]);
    expect(extractHashtags('')).toEqual([]);
  });

  it('calculates remaining characters accurately for various platforms', () => {
    // Twitter limit: 280
    expect(calculateRemainingChars('Hello', 280, 'twitter')).toBe(275);
    // Over limit gives negative remaining count
    const longText = 'a'.repeat(290);
    expect(calculateRemainingChars(longText, 280, 'twitter')).toBe(-10);
  });
});
