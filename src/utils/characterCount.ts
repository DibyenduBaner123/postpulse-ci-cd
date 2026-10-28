/**
 * Character counter utility for social media platforms.
 * Supports standard unicode grapheme counts and special handling for Twitter URL truncation.
 */

export function countCharacters(text: string, platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram'): number {
  if (!text) return 0;

  if (platform === 'twitter') {
    // Twitter t.co wraps URLs to 23 characters
    const urlRegex = /https?:\/\/[^\s]+/g;
    const textWithoutUrls = text.replace(urlRegex, '');
    const urlMatches = text.match(urlRegex);
    const urlCount = urlMatches ? urlMatches.length * 23 : 0;
    
    // Use Intl.Segmenter or Array.from for accurate multi-byte / emoji grapheme counting
    return Array.from(textWithoutUrls).length + urlCount;
  }

  // Standard unicode grapheme counting
  return Array.from(text).length;
}

export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  return matches ? matches.map((tag) => tag.toLowerCase()) : [];
}

export function calculateRemainingChars(text: string, limit: number, platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram'): number {
  const count = countCharacters(text, platform);
  return limit - count;
}
