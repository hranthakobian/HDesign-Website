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
 * Always prefers the public production domain 'https://hakobian.am'
 * and avoids internal .vercel.app deployment domains which have Vercel SSO/authentication
 * protection enabled that blocks social media crawlers (Telegram, WhatsApp, etc.).
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && !envUrl.includes('.vercel.app')) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.startsWith('http') ? clean : `https://${clean}`;
  }
  return 'https://hakobian.am';
}

/**
 * Converts any relative or internal URL to an absolute URL suitable for Open Graph crawlers.
 */
export function toAbsoluteUrl(url?: string | null): string {
  const siteUrl = getSiteUrl();
  const defaultFallback = `${siteUrl}/og-image.png`;

  if (!url || typeof url !== 'string') {
    return defaultFallback;
  }
  let trimmed = url.trim();

  // Strip pipe metadata if present (e.g. "https://... | overlay=true | position_y=50")
  if (trimmed.includes(' | ')) {
    trimmed = trimmed.split(' | ')[0].trim();
  }

  // Strip css url(...) wrapper
  const urlMatch = trimmed.match(/^url\(['"]?(.*?)['"]?\)$/i);
  if (urlMatch && urlMatch[1]) {
    trimmed = urlMatch[1].trim();
  }

  // Reject empty or data-URIs (social crawlers cannot parse data: URIs)
  if (!trimmed || trimmed.startsWith('data:')) {
    return defaultFallback;
  }

  // Replace any internal vercel deployment URL with the public domain to bypass Vercel SSO
  if (trimmed.includes('.vercel.app')) {
    trimmed = trimmed.replace(/^https?:\/\/[^\/]+/, siteUrl);
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's http on the production domain, upgrade to https
    if (trimmed.startsWith('http://hakobian.am')) {
      trimmed = trimmed.replace('http://', 'https://');
    }
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
 * Robustly extracts the best preview image for a case study, checking:
 * 1. image_url
 * 2. bg (handling pipe-delimited parameters like " | overlay=true" and url(...) wrappers)
 * 3. blocks in details (JSON array of blocks)
 * 4. markdown/html images in details
 * 5. fallback to /og-image.png
 */
export function extractCaseOgImage(foundCase: Case, siteUrl: string): string {
  const defaultFallback = `${siteUrl}/og-image.png`;

  // 1. Direct image_url if provided
  if (foundCase.image_url && typeof foundCase.image_url === 'string' && foundCase.image_url.trim()) {
    const direct = toAbsoluteUrl(foundCase.image_url);
    if (direct && direct !== defaultFallback && !direct.toLowerCase().endsWith('.svg')) {
      return direct;
    }
  }

  // 2. Background image (split pipe params, check if it's an image file or URL)
  if (foundCase.bg && typeof foundCase.bg === 'string') {
    const rawBg = foundCase.bg.split(' | ')[0].trim();
    const urlMatch = rawBg.match(/^url\(['"]?(.*?)['"]?\)$/i);
    const cleanBg = urlMatch && urlMatch[1] ? urlMatch[1].trim() : rawBg;

    if (
      cleanBg.startsWith('http://') ||
      cleanBg.startsWith('https://') ||
      cleanBg.startsWith('/uploads/') ||
      cleanBg.startsWith('uploads/') ||
      cleanBg.startsWith('/images/') ||
      /\.(png|jpe?g|webp|avif|gif)(\?.*)?$/i.test(cleanBg)
    ) {
      const absBg = toAbsoluteUrl(cleanBg);
      if (absBg && absBg !== defaultFallback && !absBg.toLowerCase().endsWith('.svg')) {
        return absBg;
      }
    }
  }

  // 3. Blocks in details
  if (foundCase.details && typeof foundCase.details === 'string') {
    const detailsTrimmed = foundCase.details.trim();
    if (detailsTrimmed.startsWith('[')) {
      try {
        const blocks = JSON.parse(detailsTrimmed);
        if (Array.isArray(blocks)) {
          for (const b of blocks) {
            const candidate = b?.image_url || b?.poster_url || (b?.type === 'image' && b?.url);
            if (candidate && typeof candidate === 'string' && candidate.trim()) {
              const absCandidate = toAbsoluteUrl(candidate);
              if (absCandidate && absCandidate !== defaultFallback && !absCandidate.toLowerCase().endsWith('.svg')) {
                return absCandidate;
              }
            }
          }
        }
      } catch {}
    } else {
      // Regex check for markdown images or html img tags in details
      const mdImg = detailsTrimmed.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/i);
      if (mdImg && mdImg[1]) {
        const absMd = toAbsoluteUrl(mdImg[1]);
        if (absMd && !absMd.toLowerCase().endsWith('.svg')) return absMd;
      }
      const htmlImg = detailsTrimmed.match(/<img[^>]+src=["'](https?:\/\/[^"']+|\/[^"']+)["']/i);
      if (htmlImg && htmlImg[1]) {
        const absHtml = toAbsoluteUrl(htmlImg[1]);
        if (absHtml && !absHtml.toLowerCase().endsWith('.svg')) return absHtml;
      }
    }
  }

  return defaultFallback;
}

/**
 * Generates Open Graph & Twitter metadata specifically for a portfolio case study.
 */
export async function getCaseMetadata(id: string): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const rawId = (id || '').trim();
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId).trim();
  } catch {}

  let foundCase: Case | null = null;

  try {
    const cases = await getCases();
    foundCase = cases.find(c => 
      c.id === rawId || 
      c.id === decodedId ||
      String(c.id).toLowerCase() === rawId.toLowerCase() ||
      String(c.id).toLowerCase() === decodedId.toLowerCase()
    ) || null;
  } catch (err) {
    console.warn('Failed to fetch cases for metadata:', err);
  }

  if (!foundCase) {
    const staticFound = staticCases.find(c => 
      c.id === rawId || 
      c.id === decodedId ||
      String(c.id).toLowerCase() === rawId.toLowerCase() ||
      String(c.id).toLowerCase() === decodedId.toLowerCase()
    );
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
      metadataBase: new URL(siteUrl),
      title: 'Քեյս չի գտնվել | HDesign',
      description: 'Հարցված նախագիծը չի գտնվել HDesign պորտֆոլիոյում։',
      openGraph: {
        title: 'Քեյս չի գտնվել | HDesign',
        description: 'Հարցված նախագիծը չի գտնվել HDesign պորտֆոլիոյում։',
        images: [
          {
            url: `${siteUrl}/og-image.png`,
            secureUrl: `${siteUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'HDesign',
            type: 'image/png'
          }
        ]
      }
    };
  }

  const rawTitle = parseBilingualText(foundCase.title, 'hy') || foundCase.title || 'Քեյս';
  const rawSubtitle = parseBilingualText(foundCase.subtitle, 'hy') || foundCase.subtitle || '';
  const rawDetails = parseBilingualText(foundCase.details, 'hy') || foundCase.details || '';
  const description = stripMarkdown(rawSubtitle || rawDetails, 160) || 'Բրենդավորման և դիզայնի քեյս — HDesign';

  // Extract valid absolute image URL
  const ogImage = extractCaseOgImage(foundCase, siteUrl);

  const pageUrl = `${siteUrl}/works/${encodeURIComponent(foundCase.id)}`;
  const title = `${rawTitle} — Բրենդավորման Քեյս | HDesign`;

  const mimeType = ogImage.toLowerCase().endsWith('.png')
    ? 'image/png'
    : ogImage.toLowerCase().endsWith('.webp')
    ? 'image/webp'
    : 'image/jpeg';

  return {
    metadataBase: new URL(siteUrl),
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
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: rawTitle,
          type: mimeType
        },
        ...(ogImage !== `${siteUrl}/og-image.png` ? [{
          url: `${siteUrl}/og-image.png`,
          secureUrl: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'HDesign Studio',
          type: 'image/png'
        }] : [])
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@hranthakobian'
    },
    other: {
      'image_src': ogImage,
      'thumbnail': ogImage
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
