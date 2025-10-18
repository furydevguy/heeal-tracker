/**
 * Capitalizes the first letter of each word in a string.
 * @param str - The input string.
 * @returns A string with each word capitalized.
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';

  return str
    .trim()
    .split(/\s+/) // Split by one or more spaces
    .map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};
