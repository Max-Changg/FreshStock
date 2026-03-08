import { format } from 'date-fns';

/**
 * Parses a YYYY-MM-DD string as local midnight — avoids the UTC off-by-one
 * bug that occurs when new Date('YYYY-MM-DD') is used in negative-UTC timezones.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a YYYY-MM-DD date string for display in the user's local timezone.
 */
export function formatDate(dateString: string): string {
  return format(parseLocalDate(dateString), 'MMM d, yyyy');
}
