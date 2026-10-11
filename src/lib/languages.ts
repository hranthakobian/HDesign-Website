export interface LanguageItem {
  id: string;
  code: string;
  label: string;      // Native or default display name
  amLabel: string;    // Armenian name
  enLabel: string;    // English name
  isUN?: boolean;     // Whether it is an official UN language
}

// 6 Official United Nations (ՄԱԿ) languages + Armenian (Հայերեն)
export const UN_LANGUAGES: LanguageItem[] = [
  { id: "hy", code: "hy", label: "Հայերեն", amLabel: "Հայերեն", enLabel: "Armenian" },
  { id: "en", code: "en", label: "English", amLabel: "Անգլերեն", enLabel: "English", isUN: true },
  { id: "fr", code: "fr", label: "Français", amLabel: "Ֆրանսերեն", enLabel: "French", isUN: true },
  { id: "ru", code: "ru", label: "Русский", amLabel: "Ռուսերեն", enLabel: "Russian", isUN: true },
  { id: "es", code: "es", label: "Español", amLabel: "Իսպաներեն", enLabel: "Spanish", isUN: true },
  { id: "ar", code: "ar", label: "العربية", amLabel: "Արաբերեն", enLabel: "Arabic", isUN: true },
  { id: "zh", code: "zh", label: "中文", amLabel: "Չինարեն", enLabel: "Chinese", isUN: true }
];

// Additional common languages that admins might want to quickly pick
export const ADDITIONAL_POPULAR_LANGUAGES: LanguageItem[] = [
  { id: "de", code: "de", label: "Deutsch", amLabel: "Գերմաներեն", enLabel: "German" },
  { id: "it", code: "it", label: "Italiano", amLabel: "Իտալերեն", enLabel: "Italian" },
  { id: "pt", code: "pt", label: "Português", amLabel: "Պորտուգալերեն", enLabel: "Portuguese" },
  { id: "ja", code: "ja", label: "日本語", amLabel: "Ճապոներեն", enLabel: "Japanese" },
  { id: "ko", code: "ko", label: "한국어", amLabel: "Կորեերեն", enLabel: "Korean" },
  { id: "tr", code: "tr", label: "Türkçe", amLabel: "Թուրքերեն", enLabel: "Turkish" },
  { id: "fa", code: "fa", label: "فارسی", amLabel: "Պարսկերեն", enLabel: "Persian" },
  { id: "ka", code: "ka", label: "ქართული", amLabel: "Վրացերեն", enLabel: "Georgian" }
];

// Mapping table for fast lookup and normalizing legacy codes (am, hy, en, ru, fr, de, es, ar, zh, etc.)
const KNOWN_LANGUAGES_MAP: Record<string, { hy: string; en: string; native: string }> = {
  hy: { hy: "Հայերեն", en: "Armenian", native: "Հայերեն" },
  am: { hy: "Հայերեն", en: "Armenian", native: "Հայերեն" },
  armenian: { hy: "Հայերեն", en: "Armenian", native: "Հայերեն" },
  հայերեն: { hy: "Հայերեն", en: "Armenian", native: "Հայերեն" },

  en: { hy: "Անգլերեն", en: "English", native: "English" },
  english: { hy: "Անգլերեն", en: "English", native: "English" },
  անգլերեն: { hy: "Անգլերեն", en: "English", native: "English" },

  ru: { hy: "Ռուսերեն", en: "Russian", native: "Русский" },
  russian: { hy: "Ռուսերեն", en: "Russian", native: "Русский" },
  ռուսերեն: { hy: "Ռուսերեն", en: "Russian", native: "Русский" },
  русский: { hy: "Ռուսերեն", en: "Russian", native: "Русский" },

  fr: { hy: "Ֆրանսերեն", en: "French", native: "Français" },
  french: { hy: "Ֆրանսերեն", en: "French", native: "Français" },
  ֆրանսերեն: { hy: "Ֆրանսերեն", en: "French", native: "Français" },
  français: { hy: "Ֆրանսերեն", en: "French", native: "Français" },

  es: { hy: "Իսպաներեն", en: "Spanish", native: "Español" },
  spanish: { hy: "Իսպաներեն", en: "Spanish", native: "Español" },
  իսպաներեն: { hy: "Իսպաներեն", en: "Spanish", native: "Español" },
  español: { hy: "Իսպաներեն", en: "Spanish", native: "Español" },

  ar: { hy: "Արաբերեն", en: "Arabic", native: "العربية" },
  arabic: { hy: "Արաբերեն", en: "Arabic", native: "العربية" },
  արաբերեն: { hy: "Արաբերեն", en: "Arabic", native: "العربية" },
  العربية: { hy: "Արաբերեն", en: "Arabic", native: "العربية" },

  zh: { hy: "Չինարեն", en: "Chinese", native: "中文" },
  chinese: { hy: "Չինարեն", en: "Chinese", native: "中文" },
  չինարեն: { hy: "Չինարեն", en: "Chinese", native: "中文" },
  中文: { hy: "Չինարեն", en: "Chinese", native: "中文" },

  de: { hy: "Գերմաներեն", en: "German", native: "Deutsch" },
  german: { hy: "Գերմաներեն", en: "German", native: "Deutsch" },
  գերմաներեն: { hy: "Գերմաներեն", en: "German", native: "Deutsch" },
  deutsch: { hy: "Գերմաներեն", en: "German", native: "Deutsch" },

  it: { hy: "Իտալերեն", en: "Italian", native: "Italiano" },
  italian: { hy: "Իտալերեն", en: "Italian", native: "Italiano" },
  իտալերեն: { hy: "Իտալերեն", en: "Italian", native: "Italiano" },
  italiano: { hy: "Իտալերեն", en: "Italian", native: "Italiano" },

  pt: { hy: "Պորտուգալերեն", en: "Portuguese", native: "Português" },
  portuguese: { hy: "Պորտուգալերեն", en: "Portuguese", native: "Português" },
  պորտուգալերեն: { hy: "Պորտուգալերեն", en: "Portuguese", native: "Português" },
  português: { hy: "Պորտուգալերեն", en: "Portuguese", native: "Português" },

  ja: { hy: "Ճապոներեն", en: "Japanese", native: "日本語" },
  japanese: { hy: "Ճապոներեն", en: "Japanese", native: "日本語" },
  ճապոներեն: { hy: "Ճապոներեն", en: "Japanese", native: "日本語" },
  日本語: { hy: "Ճապոներեն", en: "Japanese", native: "日本語" },

  ko: { hy: "Կորեերեն", en: "Korean", native: "한국어" },
  korean: { hy: "Կորեերեն", en: "Korean", native: "한국어" },
  կորեերեն: { hy: "Կորեերեն", en: "Korean", native: "한국어" },
  한국어: { hy: "Կորեերեն", en: "Korean", native: "한국어" },

  tr: { hy: "Թուրքերեն", en: "Turkish", native: "Türkçe" },
  turkish: { hy: "Թուրքերեն", en: "Turkish", native: "Türkçe" },
  թուրքերեն: { hy: "Թուրքերեն", en: "Turkish", native: "Türkçe" },
  türkçe: { hy: "Թուրքերեն", en: "Turkish", native: "Türkçe" },

  fa: { hy: "Պարսկերեն", en: "Persian", native: "فارسی" },
  persian: { hy: "Պարսկերեն", en: "Persian", native: "فارسی" },
  պարսկերեն: { hy: "Պարսկերեն", en: "Persian", native: "فարسی" },
  فارسی: { hy: "Պարսկերեն", en: "Persian", native: "فարسی" },

  ka: { hy: "Վրացերեն", en: "Georgian", native: "ქართული" },
  georgian: { hy: "Վրացերեն", en: "Georgian", native: "ქართული" },
  վրացերեն: { hy: "Վրացերեն", en: "Georgian", native: "ქართული" },
  ქართული: { hy: "Վրացերեն", en: "Georgian", native: "ქართული" }
};

/**
 * Returns a human-friendly display name for any language code or raw string.
 * Supports legacy codes ('am', 'hy', 'en', 'ru', 'fr', 'de') as well as full names.
 */
export function formatLanguageName(raw: string, locale: string = "hy"): string {
  if (!raw || typeof raw !== "string") return "";
  const cleaned = raw.trim();
  const lower = cleaned.toLowerCase();

  const match = KNOWN_LANGUAGES_MAP[lower];
  if (match) {
    if (locale === "hy") {
      return match.hy;
    }
    return match.en;
  }

  // Capitalize first letter if custom language
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
