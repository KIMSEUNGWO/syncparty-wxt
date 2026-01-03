/**
 * Profile image utilities
 * Manages random selection and URL generation for profile images (P1.png - P9.png)
 */

const PROFILE_IMAGES = [
  'P1.png', 'P2.png', 'P3.png', 'P4.png', 'P5.png',
  'P6.png', 'P7.png', 'P8.png', 'P9.png'
]

/**
 * Get a random profile image filename from the available pool
 * @returns Filename like "P3.png"
 */
export function getRandomProfileImage(): string {
  const randomIndex = Math.floor(Math.random() * PROFILE_IMAGES.length)
  return PROFILE_IMAGES[randomIndex]
}

/**
 * Get the full URL path for a profile image
 * @param filename - Profile image filename (e.g., "P3.png")
 * @returns Full path like "/profile/P3.png"
 */
export function getProfileImageUrl(filename: string): string {
  return `/profile/${filename}`
}

/**
 * Get all available profile image filenames
 * @returns Array of profile image filenames
 */
export function getAllProfileImages(): string[] {
  return [...PROFILE_IMAGES]
}
