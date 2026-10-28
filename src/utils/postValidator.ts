import { SocialPlatform, PLATFORM_CONFIGS, PostValidationResult, ValidationIssue } from '../types/index.ts';
import { countCharacters, extractHashtags } from './characterCount.ts';

export interface PostInput {
  text: string;
  platforms: SocialPlatform[];
  mediaUrls?: string[];
  platformCustomizations?: Partial<Record<SocialPlatform, { text?: string }>>;
  scheduledAt?: string | null;
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateMediaFile(file: { name: string; size: number; type: string }): {
  isValid: boolean;
  error?: string;
} {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: `Unsupported file type "${file.type}". Allowed formats: JPG, PNG, WebP, GIF.`,
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeInMB}MB) exceeds the maximum allowed limit of 5MB.`,
    };
  }

  return { isValid: true };
}

export function validatePost(input: PostInput): PostValidationResult {
  const errors: ValidationIssue[] = [];

  // General checks
  if (!input.platforms || input.platforms.length === 0) {
    errors.push({
      field: 'platforms',
      message: 'Select at least one destination platform (Twitter/X, LinkedIn, Facebook, or Instagram).',
    });
  }

  const baseText = input.text?.trim() || '';
  const mediaCount = input.mediaUrls?.length || 0;

  // Platform-specific checks
  for (const platform of input.platforms || []) {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      errors.push({
        platform,
        field: 'platform',
        message: `Unknown platform "${platform}".`,
      });
      continue;
    }

    const platformText = input.platformCustomizations?.[platform]?.text !== undefined
      ? (input.platformCustomizations[platform]?.text || '').trim()
      : baseText;

    // Check content emptiness
    if (!platformText && mediaCount === 0) {
      errors.push({
        platform,
        field: 'text',
        message: `Post content cannot be empty for ${config.name}.`,
      });
    }

    // Check character limits
    const charCount = countCharacters(platformText, platform);
    if (charCount > config.charLimit) {
      errors.push({
        platform,
        field: 'text',
        message: `${config.name} exceeds limit by ${charCount - config.charLimit} characters (Limit: ${config.charLimit}, Current: ${charCount}).`,
      });
    }

    // Media requirement (Instagram requires media)
    if (config.requiresMedia && mediaCount === 0) {
      errors.push({
        platform,
        field: 'media',
        message: `${config.name} requires at least one image or video to publish.`,
      });
    }

    // Max media limit
    if (mediaCount > config.maxMedia) {
      errors.push({
        platform,
        field: 'media',
        message: `${config.name} allows a maximum of ${config.maxMedia} media attachments (current: ${mediaCount}).`,
      });
    }

    // Hashtags check
    const hashtags = extractHashtags(platformText);
    if (hashtags.length > config.maxHashtags) {
      errors.push({
        platform,
        field: 'hashtags',
        message: `${config.name} supports a maximum of ${config.maxHashtags} hashtags (current: ${hashtags.length}).`,
      });
    }
  }

  // Schedule date validation if provided
  if (input.scheduledAt) {
    const scheduledTime = new Date(input.scheduledAt).getTime();
    if (isNaN(scheduledTime)) {
      errors.push({
        field: 'scheduledAt',
        message: 'Invalid scheduled date format.',
      });
    } else if (scheduledTime <= Date.now()) {
      errors.push({
        field: 'scheduledAt',
        message: 'Scheduled date and time must be in the future.',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
