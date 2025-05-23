import { format, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const SAUNA_TIMEZONE = 'Europe/London';

export function localToUTC(date: Date, timezone: string): Date {
  return new Date(formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
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