import type { Metadata } from 'next';
import { getCases, getAppById, getFonts, getSiteSetting, Case, AppItem, Font } from '@/lib/db';
import { brandingCases as staticCases } from '@/lib/brandingData';

/**
 * Parses multilingual string formatted like "Armenian Text | English Text".
 * Safe for server components without importing client modules.
 */
export function parseBilingualText(text?: string | null, lang: 'hy' | 'en' = 'hy'): string {
  if (!text) return '';
  const parts = text.split(' | ');
  if (parts.length > 1) {
    return lang === 'en' ? parts[1].trim() : parts[0].trim();
  }
  return text.trim();
}

/**
 * Returns the base canonical URL for the site.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`;
  }
  return 'https://hakobian.am';
}

/**
 * Converts any relative or internal URL to an absolute URL suitable for Open Graph crawlers.
 */
export function toAbsoluteUrl(url?: string | null): string {
  const siteUrl = getSiteUrl();
  if (!url || typeof url !== 'string') {
    return `${siteUrl}/og-image.png`;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return `${siteUrl}/og-image.png`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${siteUrl}${cleanPath}`;
}

/**
 * Strips markdown symbols, html tags, and language separators to create a clean preview snippet.
 */
export function stripMarkdown(text?: string | null, maxLength = 160): string {
  if (!text) return '';
  let clean = text
    .replace(/^#+\s+/gm, '') // headings
    .replace(/\!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // link labels
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/`{1,3}.*?`{1,3}/g, '') // code snippets
    .replace(/>\s+/g, '') // blockquotes
    .replace(/\|/g, ' ') // pipe separators
    .replace(/\s+/g, ' ') // repeated whitespace
    .trim();

  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength - 3).trim() + '...';
  }
  return clean;
}

/**
 * Generates root metadata for the entire site (fallback for all random pages).
 */
export async function getDefaultSiteMetadata(): Promise<Metadata> {
  const personalization = await getSiteSetting('personalization_settings', {});
  const siteTitle = personalization.site_title_hy || 'HDesign';
  const siteDesc = personalization.site_desc_hy || 'Դիզայնի և Բրենդավորման Ստուդիա';
  const siteUrl = getSiteUrl();
  const defaultImage = `${siteUrl}/og-image.png`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteTitle} — Դիզայնի և Բրենդավորման Ստուդիա`,
      template: `%s | ${siteTitle}`
    },
    description: siteDesc,
    applicationName: siteTitle,
    authors: [{ name: 'Հրանտ Հակոբյան', url: siteUrl }],
    creator: 'Հրանտ Հակոբյան',
    publisher: siteTitle,
    openGraph: {
      type: 'website',
      locale: 'hy_AM',
      alternateLocale: ['en_US'],
      url: siteUrl,
      title: `${siteTitle} — Դիզայնի և Բրենդավորման Ստուդիա`,
      description: siteDesc,
      siteName: siteTitle,
      images: [
        {
          url: defaultImage,
          width: 1200,
          height: 630,
          alt: `${siteTitle} — Դիզայնի և Բրենդավորման Ստուդիա`,
          type: 'image/png'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteTitle} — Դիզայնի և Բրենդավորման Ստուդիա`,
      description: siteDesc,
      images: [defaultImage],
      creator: '@hranthakobian'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

/**
 * Generates Open Graph & Twitter metadata specifically for a portfolio case study.
 */
export async function getCaseMetadata(id: string): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  let foundCase: Case | null = null;

  try {
    const cases = await getCases();
    foundCase = cases.find(c => c.id === id) || null;
  } catch (err) {
    console.warn('Failed to fetch cases for metadata:', err);
  }

  if (!foundCase) {
    const staticFound = staticCases.find(c => c.id === id);
    if (staticFound) {
      foundCase = {
        id: staticFound.id,
        title: staticFound.title,
        subtitle: staticFound.tagline,
        bg: staticFound.color,
        image_url: staticFound.image,
        details: staticFound.description,
        category: (staticFound as any).category || 'Բրենդավորում',
        client: (staticFound as any).client || 'HDesign Studio',
        year: (staticFound as any).year || '2026'
      };
    }
  }

  if (!foundCase) {
    return {
      title: 'Քեյս չի գտնվել | HDesign',
      description: 'Հարցված նախագիծը չի գտնվել HDesign պորտֆոլիոյում։',
      openGraph: {
        title: 'Քեյս չի գտնվել | HDesign',
        description: 'Հարցված նախագիծը չի գտնվել HDesign պորտֆոլիոյում։',
        images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630 }]
      }
    };
  }

  const rawTitle = parseBilingualText(foundCase.title, 'hy') || foundCase.title || 'Քեյս';
  const rawSubtitle = parseBilingualText(foundCase.subtitle, 'hy') || foundCase.subtitle || '';
  const rawDetails = parseBilingualText(foundCase.details, 'hy') || foundCase.details || '';
  const description = stripMarkdown(rawSubtitle || rawDetails, 160) || 'Բրենդավորման և դիզայնի քեյս — HDesign';

  // Extract the most representative preview image
  let ogImage = '';
  if (foundCase.image_url && foundCase.image_url.trim()) {
    ogImage = toAbsoluteUrl(foundCase.image_url);
  } else if (foundCase.bg && (foundCase.bg.startsWith('http') || foundCase.bg.startsWith('/uploads'))) {
    ogImage = toAbsoluteUrl(foundCase.bg);
  } else if (foundCase.details && foundCase.details.startsWith('[')) {
    try {
      const blocks = JSON.parse(foundCase.details);
      const imgBlock = blocks.find((b: any) => (b.type === 'image' || b.type === 'banner') && b.image_url);
      if (imgBlock?.image_url) {
        ogImage = toAbsoluteUrl(imgBlock.image_url);
      }
    } catch {}
  }

  // If case has no custom image, generate a high-res branded dynamic OG image
  if (!ogImage) {
    const bgParam = encodeURIComponent(foundCase.bg || '#083f39');
    const titleParam = encodeURIComponent(rawTitle);
    const subParam = encodeURIComponent(rawSubtitle || 'HDesign Portfolio Case');
    ogImage = `${siteUrl}/api/og?title=${titleParam}&subtitle=${subParam}&bg=${bgParam}&category=${encodeURIComponent('Բրենդավորման Քեյս')}`;
  }

  const pageUrl = `${siteUrl}/works/${id}`;
  const title = `${rawTitle} — Բրենդավորման Քեյս | HDesign`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'hy_AM',
      alternateLocale: ['en_US'],
      url: pageUrl,
      title,
      description,
      siteName: 'HDesign',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: rawTitle,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@hranthakobian'
    }
  };
}

/**
 * Generates Open Graph & Twitter metadata specifically for an Application or Plugin.
 */
export async function getAppMetadata(id: string): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  let app: AppItem | null = null;

  try {
    app = await getAppById(id);
  } catch (err) {
    console.warn('Failed to fetch app for metadata:', err);
  }

  if (!app) {
    return {
      title: 'Հավելվածը չի գտնվել | HDesign',
      description: 'Հարցված հավելվածը կամ ընդլայնումը չի գտնվել։',
      openGraph: {
        title: 'Հավելվածը չի գտնվել | HDesign',
        description: 'Հարցված հավելվածը կամ ընդլայնումը չի գտնվել։',
        images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630 }]
      }
    };
  }

  const titleText = app.title_am || app.title_en || 'HDesign App';
  const descText = stripMarkdown(app.short_desc_am || app.short_desc_en || app.description_md_am || app.description_md_en, 160) || 'Հավելվածներ և ընդլայնումներ դիզայներների համար';

  // Determine app preview image
  let ogImage = '';
  if (app.cover_image && app.cover_image.trim()) {
    ogImage = toAbsoluteUrl(app.cover_image);
  } else if (Array.isArray(app.gallery_images) && app.gallery_images.length > 0 && app.gallery_images[0]?.trim()) {
    ogImage = toAbsoluteUrl(app.gallery_images[0]);
  } else if (app.host_app_icon && app.host_app_icon.trim()) {
    ogImage = toAbsoluteUrl(app.host_app_icon);
  } else {
    const titleParam = encodeURIComponent(titleText);
    const subParam = encodeURIComponent(descText);
    ogImage = `${siteUrl}/api/og?title=${titleParam}&subtitle=${subParam}&category=${encodeURIComponent(app.host_app || 'Հավելված')}`;
  }

  const pageUrl = `${siteUrl}/apps/${id}`;
  const metaTitle = `${titleText} | HDesign Apps`;

  return {
    title: metaTitle,
    description: descText,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'hy_AM',
      alternateLocale: ['en_US'],
      url: pageUrl,
      title: metaTitle,
      description: descText,
      siteName: 'HDesign',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: titleText,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: descText,
      images: [ogImage],
      creator: '@hranthakobian'
    }
  };
}

/**
 * Generates Open Graph & Twitter metadata specifically for a Font.
 */
export async function getFontMetadata(id: string): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  let font: Font | null = null;

  try {
    const fonts = await getFonts();
    font = fonts.find(f => f.id === id) || null;
  } catch (err) {
    console.warn('Failed to fetch font for metadata:', err);
  }

  if (!font) {
    return {
      title: 'Տառատեսակը չի գտնվել | HDesign',
      description: 'Հարցված տառատեսակը չի գտնվել։',
      openGraph: {
        title: 'Տառատեսակը չի գտնվել | HDesign',
        description: 'Հարցված տառատեսակը չի գտնվել։',
        images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630 }]
      }
    };
  }

  const nameText = font.name_am || font.name_en || 'HDesign Տառատեսակ';
  const descText = stripMarkdown(font.description_am || font.description_en, 160) || 'Հեղինակային տառատեսակներ — HDesign';

  const titleParam = encodeURIComponent(nameText);
  const subParam = encodeURIComponent(descText);
  const ogImage = `${siteUrl}/api/og?title=${titleParam}&subtitle=${subParam}&category=${encodeURIComponent('Տառատեսակ')}`;

  const pageUrl = `${siteUrl}/fonts/${id}`;
  const metaTitle = `${nameText} | HDesign Fonts`;

  return {
    title: metaTitle,
    description: descText,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'hy_AM',
      alternateLocale: ['en_US'],
      url: pageUrl,
      title: metaTitle,
      description: descText,
      siteName: 'HDesign',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: nameText,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: descText,
      images: [ogImage],
      creator: '@hranthakobian'
    }
  };
}

/**
 * Helper to generate page metadata for top-level pages (/works, /apps, /fonts, /about, /contact, etc.)
 */
export function getSectionPageMetadata(
  title: string,
  description: string,
  path: string,
  customImage?: string
): Metadata {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const ogImage = customImage ? toAbsoluteUrl(customImage) : `${siteUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'hy_AM',
      alternateLocale: ['en_US'],
      url: pageUrl,
      title,
      description,
      siteName: 'HDesign',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@hranthakobian'
    }
  };
}
