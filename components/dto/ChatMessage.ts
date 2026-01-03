/**
 * Chat message data structure
 */
export interface ChatMessage {
  /** Unique message identifier (UUID) */
  id: string

  /** User ID who sent the message */
  userId: string

  /** Display name of the user */
  userName: string

  /** Profile image filename (e.g., "P3.svg") */
  profileImage: string

  /** Message text content */
  message: string

  /** Timestamp in milliseconds (Date.now()) */
  timestamp: number
}
