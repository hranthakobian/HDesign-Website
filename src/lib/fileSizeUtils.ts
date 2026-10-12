export type FileSizeUnit = 'MB' | 'KB' | 'GB' | 'B';

export const FILE_SIZE_UNITS: { value: FileSizeUnit; labelAm: string; labelEn: string }[] = [
  { value: 'MB', labelAm: 'ՄԲ', labelEn: 'MB' },
  { value: 'KB', labelAm: 'ԿԲ', labelEn: 'KB' },
  { value: 'GB', labelAm: 'ԳԲ', labelEn: 'GB' },
  { value: 'B',  labelAm: 'Բ',  labelEn: 'B' },
];

/**
 * Parses any raw file size string into numeric part and unit.
 * Examples:
 *   "149 KB" -> { number: "149", unit: "KB" }
 *   "149 ԿԲ" -> { number: "149", unit: "KB" }
 *   "25 MB"  -> { number: "25", unit: "MB" }
 *   "25 ՄԲ"  -> { number: "25", unit: "MB" }
 *   "1.2 GB" -> { number: "1.2", unit: "GB" }
 *   "1.2 ԳԲ" -> { number: "1.2", unit: "GB" }
 *   "500"    -> { number: "500", unit: "MB" }
 */
export function parseFileSize(raw?: string | null): { number: string; unit: FileSizeUnit } {
  if (!raw || !raw.trim()) {
    return { number: '', unit: 'MB' };
  }
  const str = raw.trim();
  const match = str.match(/^([\d.]+)\s*(կբ|kb|մբ|mb|գբ|gb|բ|b)?$/i);
  if (match) {
    const num = match[1];
    const u = (match[2] || '').toLowerCase();
    if (u === 'մբ' || u === 'mb') return { number: num, unit: 'MB' };
    if (u === 'կբ' || u === 'kb') return { number: num, unit: 'KB' };
    if (u === 'գբ' || u === 'gb') return { number: num, unit: 'GB' };
    if (u === 'բ' || u === 'b') return { number: num, unit: 'B' };
    return { number: num, unit: 'MB' };
  }
  return { number: str, unit: 'MB' };
}

/**
 * Formats a file size string according to locale:
 * Armenian (hy): "149 ԿԲ", "25 ՄԲ", "1.2 ԳԲ", "500 Բ"
 * English (en):  "149 KB", "25 MB", "1.2 GB", "500 B"
 */
export function formatDisplayFileSize(raw?: string | null, locale: string = 'hy'): string {
  if (!raw || !raw.trim()) return '—';
  const str = raw.trim();

  // Handle multiple comma-separated sizes
  if (str.includes(',')) {
    return str.split(',').map(s => formatDisplayFileSize(s.trim(), locale)).join(', ');
  }

  const match = str.match(/^([\d.]+)\s*(կբ|kb|մբ|mb|գբ|gb|բ|b)?$/i);
  if (!match) return str;

  const num = match[1];
  const u = (match[2] || '').toLowerCase();
  let standardUnit: FileSizeUnit = 'MB';
  if (u === 'կբ' || u === 'kb') standardUnit = 'KB';
  else if (u === 'մբ' || u === 'mb') standardUnit = 'MB';
  else if (u === 'գբ' || u === 'gb') standardUnit = 'GB';
  else if (u === 'բ' || u === 'b') standardUnit = 'B';
  else standardUnit = 'MB';

  if (locale === 'hy') {
    const hyUnit = standardUnit === 'MB' ? 'ՄԲ' : (standardUnit === 'KB' ? 'ԿԲ' : (standardUnit === 'GB' ? 'ԳԲ' : 'Բ'));
    return `${num} ${hyUnit}`;
  }
  return `${num} ${standardUnit}`;
}
