/**
 * Check if the current time is before 12:00:00 (Noon)
 */
export function isBeforeNoon(): boolean {
  const now = new Date();
  return now.getHours() < 12;
}

/**
 * Returns the time remaining until 12:00:00 today as a string "HH:MM:SS"
 * If already past 12:00:00, returns "00:00:00"
 */
export function getTimeRemainingUntilNoon(): string {
  const now = new Date();
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);

  const diff = noon.getTime() - now.getTime();
  if (diff <= 0) return "00:00:00";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
