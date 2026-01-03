/**
 * Profile image utilities
 * Manages random selection and URL generation for profile images (P1.svg - P9.svg)
 */

const PROFILE_IMAGES = [
  'P1.svg', 'P2.svg', 'P3.svg', 'P4.svg', 'P5.svg',
  'P6.svg', 'P7.svg', 'P8.svg', 'P9.svg'
]

/**
 * Get a random profile image filename from the available pool
 * @returns Filename like "P3.svg"
 */
export function getRandomProfileImage(): string {
  const randomIndex = Math.floor(Math.random() * PROFILE_IMAGES.length)
  return PROFILE_IMAGES[randomIndex]
}

/**
 * Get the full URL path for a profile image
 * @param filename - Profile image filename (e.g., "P3.svg")
 * @returns Full path like "/profile/P3.svg"
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
