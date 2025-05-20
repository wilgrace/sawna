/**
 * Utility functions for day mapping between string representations and integers
 */

// Map of short day names to integers (0-6, where 0 is Sunday)
export const shortDayToInt: Record<string, number> = {
  'sun': 0,
  'mon': 1,
  'tue': 2,
  'wed': 3,
  'thu': 4,
  'fri': 5,
  'sat': 6
};

// Map of full day names to integers (0-6, where 0 is Sunday)
export const fullDayToInt: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

// Map of integers to short day names
export const intToShortDay: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat'
};

// Map of integers to full day names
export const intToFullDay: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

/**
 * Converts a day string (short or full) to its corresponding integer (0-6)
 * @param day - The day string (e.g., 'mon' or 'monday')
 * @returns The corresponding integer (0-6)
 * @throws Error if the day string is invalid
 */
export function mapDayStringToInt(day: string): number {
  const normalizedDay = day.toLowerCase();
  const intValue = shortDayToInt[normalizedDay] ?? fullDayToInt[normalizedDay];
  
  if (intValue === undefined) {
    throw new Error(`Invalid day string: ${day}`);
  }
  
  return intValue;
}

/**
 * Converts an integer (0-6) to its corresponding day string
 * @param dayInt - The integer representing the day (0-6)
 * @param useFullName - Whether to use full day names (default: false)
 * @returns The corresponding day string
 * @throws Error if the integer is invalid
 */
export function mapIntToDayString(dayInt: number, useFullName: boolean = false): string {
  if (dayInt < 0 || dayInt > 6) {
    throw new Error(`Invalid day integer: ${dayInt}`);
  }
  
  return useFullName ? intToFullDay[dayInt] : intToShortDay[dayInt];
}

/**
 * Validates if a day string is valid (either short or full format)
 * @param day - The day string to validate
 * @returns boolean indicating if the day string is valid
 */
export function isValidDayString(day: string): boolean {
  const normalizedDay = day.toLowerCase();
  return normalizedDay in shortDayToInt || normalizedDay in fullDayToInt;
}

/**
 * Converts between short and full day names
 * @param day - The day string to convert
 * @param toFull - Whether to convert to full name (true) or short name (false)
 * @returns The converted day string
 * @throws Error if the input day string is invalid
 */
export function convertDayFormat(day: string, toFull: boolean): string {
  const normalizedDay = day.toLowerCase();
  const intValue = mapDayStringToInt(normalizedDay);
  return mapIntToDayString(intValue, toFull);
} 