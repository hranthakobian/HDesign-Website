/**
 * Utility functions for date formatting across HDesign applications.
 */

export const HY_MONTHS_SHORT = [
  'հնվ', // Jan
  'փտվ', // Feb
  'մրտ', // Mar
  'ապր', // Apr
  'մյս', // May
  'հնս', // Jun
  'հլս', // Jul
  'օգս', // Aug
  'սեպ', // Sep
  'հոկ', // Oct
  'նոյ', // Nov
  'դեկ'  // Dec
];

/**
 * Formats a release date or updated date.
 * Armenian format: "12 հոկ, 2026 թ."
 * English format: "Oct 12, 2026"
 */
export function formatReleaseDate(dateInput?: string | Date | null, locale: string = 'hy'): string {
  if (!dateInput) return '—';

  try {
    let year: number;
    let month: number;
    let day: number;

    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed) return '—';

      // Parse YYYY-MM-DD directly to prevent UTC timezone offsets from shifting the day
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      } else {
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) return dateInput;
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
    } else if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) return '—';
      year = dateInput.getFullYear();
      month = dateInput.getMonth();
      day = dateInput.getDate();
    } else {
      return '—';
    }

    if (locale === 'hy') {
      const monthShort = HY_MONTHS_SHORT[month] || '';
      return `${day} ${monthShort}, ${year} թ.`;
    }

    const d = new Date(Date.UTC(year, month, day));
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  } catch {
    return typeof dateInput === 'string' ? dateInput : '—';
  }
}
