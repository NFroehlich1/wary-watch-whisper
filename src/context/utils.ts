
/**
 * Utility functions for scam detection context
 */

import { MAX_BACKOFF_MS, INITIAL_BACKOFF_MS, BACKOFF_FACTOR } from "./constants";

/**
 * Calculate backoff time for retry attempts using exponential backoff
 */
export const calculateBackoffTime = (attempt: number): number => {
  // Use exponential backoff formula: initialBackoff * (factor ^ attempt)
  const backoffTime = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_FACTOR, attempt);
  // Make sure we don't exceed the maximum backoff time
  return Math.min(backoffTime, MAX_BACKOFF_MS);
};
