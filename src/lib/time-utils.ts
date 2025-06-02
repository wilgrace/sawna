import { format, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const SAUNA_TIMEZONE = 'Europe/London';

export function localToUTC(date: Date, timezone: string): Date {
  // Create a date string in ISO format with the timezone offset
  const dateStr = formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  // Parse it back to get the correct UTC time
  return parseISO(dateStr);
}

export function utcToLocal(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone);
}

export function formatLocalTime(date: Date, timezone: string): string {
  const localDate = utcToLocal(date, timezone);
  return format(localDate, 'HH:mm');
}

export function formatLocalDate(date: Date, timezone: string): string {
  const localDate = utcToLocal(date, timezone);
  return format(localDate, 'yyyy-MM-dd');
} 