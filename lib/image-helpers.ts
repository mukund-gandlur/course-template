/**
 * Image helper utilities for getting free images from Picsum Photos
 * Uses Picsum Photos API (free, no authentication required)
 * https://picsum.photos
 */

/**
 * Get a random image URL from Picsum Photos
 * @param width - Image width (default: 800)
 * @param height - Image height (default: 450)
 * @returns Picsum Photos image URL
 */
export function getRandomImageUrl(
  width: number = 800,
  height: number = 450
): string {
  // Picsum Photos - free random images
  // Format: https://picsum.photos/{width}/{height}
  return `https://picsum.photos/${width}/${height}`
}

/**
 * Get a deterministic image URL based on a seed (same seed = same image)
 * Uses Picsum Photos seed parameter for consistent images
 * @param seed - Seed value for deterministic image selection
 * @param width - Image width (default: 800)
 * @param height - Image height (default: 450)
 * @returns Picsum Photos image URL
 */
export function getSeededImageUrl(
  seed: string | number,
  width: number = 800,
  height: number = 450
): string {
  // Convert seed to a number for Picsum
  const seedNum = typeof seed === "number" 
    ? seed 
    : seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // Picsum Photos with seed - same seed returns same image
  // Format: https://picsum.photos/seed/{seed}/{width}/{height}
  return `https://picsum.photos/seed/${seedNum}/${width}/${height}`
}

/**
 * Get a course thumbnail URL, falling back to Unsplash if not provided
 * @param thumbnailUrl - Existing thumbnail URL (optional)
 * @param courseId - Course ID for generating a seeded image
 * @param width - Image width (default: 800)
 * @param height - Image height (default: 450)
 * @returns Image URL
 */
export function getCourseThumbnail(
  thumbnailUrl?: string,
  courseId?: string,
  width: number = 800,
  height: number = 450
): string {
  if (thumbnailUrl) {
    return thumbnailUrl
  }
  
  // Generate a seeded image based on course ID for consistency
  if (courseId) {
    return getSeededImageUrl(courseId, width, height)
  }
  
  // Fallback to random image
  return getRandomImageUrl(width, height)
}

