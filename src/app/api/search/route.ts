import { NextResponse } from 'next/server';
import { getApps, getCases, getFonts } from '@/lib/db';
import { brandingCases as staticBrandingCases } from '@/lib/brandingData';

export type SearchItemType = 'app' | 'case' | 'font' | 'image' | 'page' | 'doc';

export interface SearchIndexItem {
  id: string;
  type: SearchItemType;
  title_hy: string;
  title_en: string;
  subtitle_hy?: string;
  subtitle_en?: string;
  description_hy?: string;
  description_en?: string;
  url: string;
  image?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Published static site pages
const PUBLISHED_PAGES: SearchIndexItem[] = [
  {
    id: 'page-home',
    type: 'page',
    title_hy: 'Գլխավոր Էջ',
    title_en: 'Home Page',
    subtitle_hy: 'Հրանտ Հակոբյան - Դիզայնի և Բրենդավորման Պորտֆոլիո',
    subtitle_en: 'Hrant Hakobyan - Design & Branding Portfolio',
    description_hy: 'Բարի գալուստ HDesign: Գրաֆիկական դիզայն, բրենդինգ, տառատեսակներ և հավելվածներ:',
    description_en: 'Welcome to HDesign. Graphic design, branding, typography, and applications.',
    url: '/',
    tags: ['home', 'տուն', 'գլխավոր', 'դիզայն', 'պորտֆոլիո', 'hrant', 'hakobyan', 'հրանտ', 'հակոբյան']
  },
  {
    id: 'page-about',
    type: 'page',
    title_hy: 'Իմ Մասին',
    title_en: 'About Me',
    subtitle_hy: 'Կենսագրություն, փորձառություն և հմտություններ',
    subtitle_en: 'Biography, experience and skills',
    description_hy: 'Հրանտ Հակոբյան - Գրաֆիկական դիզայներ, տառատեսակների հեղինակ և ծրագրավորող:',
    description_en: 'Hrant Hakobyan - Graphic designer, type designer and developer.',
    url: '/about',
    tags: ['about', 'մասին', 'ռեզյումե', 'resume', 'skills', 'հմտություններ', 'փորձ', 'հեղինակ', 'կենսագրություն']
  },
  {
    id: 'page-works',
    type: 'page',
    title_hy: 'Աշխատանքներ / Պորտֆոլիո',
    title_en: 'Works / Portfolio',
    subtitle_hy: 'Բրենդինգ, պաստառներ, արտ և դիզայն նախագծեր',
    subtitle_en: 'Branding, posters, art and design projects',
    description_hy: 'Բոլոր ստեղծագործական նախագծերը, բրենդավորումները և պատկերասրահը:',
    description_en: 'All creative projects, brandings and design showcase.',
    url: '/works',
    tags: ['works', 'աշխատանքներ', 'պորտֆոլիո', 'portfolio', 'branding', 'բրենդինգ', 'նախագծեր']
  },
  {
    id: 'page-works-branding',
    type: 'page',
    title_hy: 'Բրենդինգի Աշխատանքներ',
    title_en: 'Branding Projects',
    subtitle_hy: 'Լոգոներ, կորպորատիվ ոճ և փաթեթավորում',
    subtitle_en: 'Logos, corporate identity and packaging',
    description_hy: 'Կորպորատիվ բրենդինգի և ինքնության մշակման աշխատանքներ:',
    description_en: 'Corporate branding and visual identity design projects.',
    url: '/works?category=branding',
    tags: ['branding', 'բրենդինգ', 'լոգո', 'logo', 'տարբերանշան', 'փաթեթավորում', 'ինքնություն']
  },
  {
    id: 'page-works-design',
    type: 'page',
    title_hy: 'Պատկերասրահ / Դիզայն',
    title_en: 'Gallery / Design',
    subtitle_hy: 'Պաստառներ, թվային արտ և վիզուալ գրաֆիկա',
    subtitle_en: 'Posters, digital art and visual graphics',
    description_hy: 'Գեղարվեստական պաստառներ, ցուցահանդեսային գրաֆիկա և արտ նախագծեր:',
    description_en: 'Art posters, exhibition graphics and artwork projects.',
    url: '/works?category=design',
    tags: ['design', 'դիզայն', 'պաստառներ', 'posters', 'art', 'արտ', 'պատկերասրահ', 'ցուցահանդես']
  },
  {
    id: 'page-fonts',
    type: 'page',
    title_hy: 'Տառատեսակներ',
    title_en: 'Typography / Fonts',
    subtitle_hy: 'Հեղինակային հայկական և լատինական տառատեսակներ',
    subtitle_en: 'Original Armenian and Latin typefaces',
    description_hy: 'Ներբեռնեք կամ գնեք հեղինակային տառատեսակներ HDesign-ից:',
    description_en: 'Download or purchase bespoke fonts crafted by HDesign.',
    url: '/fonts',
    tags: ['fonts', 'տառատեսակներ', 'տառատեսակ', 'font', 'տիպոգրաֆիկա', 'typography', 'տառ']
  },
  {
    id: 'page-apps',
    type: 'page',
    title_hy: 'Հավելվածներ և Փլագիններ',
    title_en: 'Apps & Plugins',
    subtitle_hy: 'Գործիքներ դիզայներների և արվեստագետների համար',
    subtitle_en: 'Tools for designers and creative professionals',
    description_hy: 'Adobe Photoshop, Illustrator, Premiere փլագիններ և ինքնուրույն հավելվածներ:',
    description_en: 'Adobe Photoshop, Illustrator, Premiere plugins and standalone tools.',
    url: '/apps',
    tags: ['apps', 'հավելվածներ', 'հավելված', 'ծրագիր', 'գործիք', 'փլագիններ', 'plugins', 'photoshop', 'illustrator', 'tools']
  },
  {
    id: 'page-hdesign',
    type: 'page',
    title_hy: 'HDesign Համակարգ',
    title_en: 'HDesign System',
    subtitle_hy: 'Կոմպոնենտների գրադարան և դիզայն համակարգ',
    subtitle_en: 'Component library and design system',
    description_hy: 'HDesign UI վեբ-բաղադրիչներ, տոկեններ և փաստաթղթավորում:',
    description_en: 'HDesign UI web components, tokens and design system documentation.',
    url: '/hdesign',
    tags: ['hdesign', 'design system', 'համակարգ', 'components', 'բաղադրիչներ', 'կոմպոնենտներ']
  },
  {
    id: 'page-hdesign-docs',
    type: 'doc',
    title_hy: 'HDesign Փաստաթղթեր',
    title_en: 'HDesign Documentation',
    subtitle_hy: 'hd-button, hd-select, hd-input, hd-switch և այլ բաղադրիչներ',
    subtitle_en: 'hd-button, hd-select, hd-input, hd-switch and other components',
    description_hy: 'Ինչպես օգտագործել HDesign վեբ-կոմպոնենտները կոդի մեջ օրինակներով:',
    description_en: 'How to use HDesign web components with live code examples.',
    url: '/hdesign/docs',
    tags: ['docs', 'փաստաթղթեր', 'hd-button', 'hd-input', 'hd-select', 'hd-switch', 'hd-slider', 'api', 'կոճակ', 'մուտքագրում']
  },
  {
    id: 'page-hdesign-samples',
    type: 'doc',
    title_hy: 'HDesign Փորձանմուշներ',
    title_en: 'HDesign Samples',
    subtitle_hy: 'Ինտերակտիվ նմուշներ և ինտերֆեյսի օրինակներ',
    subtitle_en: 'Interactive samples and UI showcase',
    description_hy: 'HDesign կոմպոնենտների իրական օգտագործման ինտերակտիվ ցուցադրություն:',
    description_en: 'Interactive demonstration of HDesign components in action.',
    url: '/hdesign/samples',
    tags: ['samples', 'փորձանմուշներ', 'demo', 'կոմպոնենտներ', 'ui', 'ցուցադրություն']
  },
  {
    id: 'page-contact',
    type: 'page',
    title_hy: 'Կապ և Հաղորդակցություն',
    title_en: 'Contact & Inquiries',
    subtitle_hy: 'Համագործակցություն, նամակագրություն և սոցցանցեր',
    subtitle_en: 'Collaboration, messaging and social networks',
    description_hy: 'Կապվեք Հրանտ Հակոբյանի հետ նոր նախագծերի և հարցումների համար:',
    description_en: 'Get in touch with Hrant Hakobyan for projects and inquiries.',
    url: '/contact',
    tags: ['contact', 'կապ', 'էլ․ հասցե', 'email', 'հաղորդագրություն', 'message', 'հեռախոս', 'սոցցանցեր']
  }
];

// Published core branding images on the website
const PUBLISHED_BRANDING_IMAGES = [
  {
    id: 'img-pasta',
    title_hy: 'Pasta Բրենդինգ Շապիկ',
    title_en: 'Pasta Branding Cover',
    subtitle_hy: 'Իտալական խոհանոցի տեսողական ինքնություն • 1200×800px',
    subtitle_en: 'Italian cuisine visual identity • 1200×800px',
    url: '/works?case=pasta',
    image: '/branding/pasta.png',
    tags: ['pasta', 'պաստա', 'մակարոն', 'բրենդինգ', 'փաթեթավորում', 'իտալական', 'կարմիր']
  },
  {
    id: 'img-eleven',
    title_hy: '11... Ստեղծարար Պաստառներ',
    title_en: '11... Creative Posters',
    subtitle_hy: 'Մինիմալիստական երկրաչափություն և արվեստ • 1200×800px',
    subtitle_en: 'Minimalist geometry & art • 1200×800px',
    url: '/works?case=eleven',
    image: '/branding/eleven.png',
    tags: ['eleven', '11', 'տասնմեկ', 'պաստառ', 'մինիմալիզմ', 'երկրաչափություն', 'նարնջագույն']
  },
  {
    id: 'img-posters',
    title_hy: 'Posters Ցուցահանդեսի Գրաֆիկա',
    title_en: 'Posters Exhibition Artwork',
    subtitle_hy: 'Տառատեսակային պաստառային արվեստ • 1200×800px',
    subtitle_en: 'Typography poster artwork • 1200×800px',
    url: '/works?case=posters',
    image: '/branding/posters.png',
    tags: ['posters', 'պաստառներ', 'ցուցահանդես', 'արտ', 'տիպոգրաֆիկա', 'մորեգույն']
  },
  {
    id: 'img-teal',
    title_hy: 'Teal Lines Մինիմալիստական Արտ',
    title_en: 'Teal Lines Minimalist Art',
    subtitle_hy: 'Էկոլոգիական տեխնոլոգիաների գծային ինքնություն • 1200×800px',
    subtitle_en: 'Eco-tech linear visual identity • 1200×800px',
    url: '/works?case=teal-lines',
    image: '/branding/teal.png',
    tags: ['teal', 'կանաչ', 'էկո', 'տեխնոլոգիա', 'գծեր', 'աբստրակտ']
  },
  {
    id: 'img-mobile',
    title_hy: 'Mobile UI Մոբայլ Ինտերֆեյս',
    title_en: 'Mobile UI Design Showcase',
    subtitle_hy: 'Ֆինտեխ հավելվածի ինտերֆեյս և UX • 1200×800px',
    subtitle_en: 'FinTech mobile app interface & UX • 1200×800px',
    url: '/works?case=mobile-ui',
    image: '/branding/mobile.png',
    tags: ['mobile', 'հեռախոս', 'բջջային', 'ինտերֆեյս', 'ui', 'ux', 'հավելված', 'ֆինտեխ']
  },
  {
    id: 'img-logo',
    title_hy: 'HDesign Լոգո / Տարբերանշան',
    title_en: 'HDesign Brand Mark',
    subtitle_hy: 'Ստուդիայի պաշտոնական տարբերանշան',
    subtitle_en: 'Official studio brand mark',
    url: '/',
    image: '/logo.png',
    tags: ['logo', 'լոգո', 'տարբերանշան', 'hdesign', 'հրանտ', 'հակոբյան']
  },
  {
    id: 'img-profile',
    title_hy: 'Հրանտ Հակոբյան (Դիմանկար)',
    title_en: 'Hrant Hakobyan (Portrait)',
    subtitle_hy: 'Դիզայների պաշտոնական դիմանկար',
    subtitle_en: 'Official portrait photo',
    url: '/about',
    image: '/profile_hrant.jpg',
    tags: ['hrant', 'hakobyan', 'հրանտ', 'հակոբյան', 'դիզայներ', 'լուսանկար']
  }
];

export async function GET() {
  try {
    const items: SearchIndexItem[] = [...PUBLISHED_PAGES];

    // 1. Index ONLY Published Apps (Strict check)
    try {
      const allApps = await getApps();
      const publishedApps = allApps.filter(app => {
        // Exclude drafts strictly
        if (app.is_draft) return false;
        if (app.status === 'draft') return false;
        // Must have title and valid id
        return !!(app.title_am || app.title_en);
      });

      for (const app of publishedApps) {
        items.push({
          id: `app-${app.id}`,
          type: 'app',
          title_hy: app.title_am || app.title_en || '',
          title_en: app.title_en || app.title_am || '',
          subtitle_hy: `${app.host_app || 'App'} • ${app.version || '1.0'}`,
          subtitle_en: `${app.host_app || 'App'} • ${app.version || '1.0'}`,
          description_hy: app.short_desc_am || app.short_desc_en || '',
          description_en: app.short_desc_en || app.short_desc_am || '',
          url: `/apps/${app.id}`,
          image: app.cover_image || app.host_app_icon || '',
          category: app.app_type || app.host_app || 'Հավելված',
          tags: [
            'app',
            'հավելված',
            'ծրագիր',
            'գործիք',
            app.host_app || '',
            ...(Array.isArray(app.languages) ? app.languages : []),
            ...(Array.isArray(app.supported_os) ? app.supported_os : [])
          ].filter(Boolean),
          metadata: {
            host_app: app.host_app,
            paid: app.is_paid,
            price: app.price,
            version: app.version
          }
        });
      }
    } catch (err) {
      console.warn('Failed to index published apps for search:', err);
    }

    // 2. Index Published Cases / Portfolio Works
    try {
      // Index static published branding cases from brandingData.ts
      for (const bc of staticBrandingCases) {
        const titleParts = (bc.title || '').split('|').map(s => s.trim());
        const titleHy = titleParts[0] || bc.title;
        const titleEn = titleParts[1] || titleParts[0];

        const taglineParts = (bc.tagline || '').split('|').map(s => s.trim());
        const descParts = (bc.description || '').split('|').map(s => s.trim());

        const imgMap: Record<string, string> = {
          'pasta': '/branding/pasta.png',
          'eleven': '/branding/eleven.png',
          'posters': '/branding/posters.png',
          'teal-lines': '/branding/teal.png',
          'mobile-ui': '/branding/mobile.png'
        };

        items.push({
          id: `case-branding-${bc.id}`,
          type: 'case',
          title_hy: titleHy,
          title_en: titleEn,
          subtitle_hy: taglineParts[0] || 'Բրենդինգ նախագիծ',
          subtitle_en: taglineParts[1] || taglineParts[0] || 'Branding Project',
          description_hy: descParts[0] || '',
          description_en: descParts[1] || descParts[0] || '',
          url: `/works?case=${encodeURIComponent(bc.id)}`,
          image: imgMap[bc.id] || '',
          category: 'Բրենդինգ',
          tags: ['case', 'քեյս', 'բրենդինգ', 'աշխատանք', 'portfolio', bc.id, titleHy, titleEn],
          metadata: {
            color: bc.color
          }
        });
      }

      // Also index dynamic published cases from db
      const dbCases = await getCases();
      for (const c of dbCases) {
        // Skip duplicate of seeds if already in staticBrandingCases
        if (c.id === 'seed-1' || c.id === 'seed-2' || c.id === 'seed-3' || c.id === 'seed-4' || c.id === 'seed-5') {
          continue;
        }

        const titleParts = (c.title || '').split('|').map(s => s.trim());
        const titleHy = titleParts[0] || c.title || '';
        const titleEn = titleParts[1] || titleParts[0] || c.title || '';

        const subtitleParts = (c.subtitle || '').split('|').map(s => s.trim());
        const subtitleHy = subtitleParts[0] || c.subtitle || '';
        const subtitleEn = subtitleParts[1] || subtitleParts[0] || c.subtitle || '';

        const detailsParts = (c.details || '').split('|').map(s => s.trim());
        const detailsHy = detailsParts[0] || c.details || '';
        const detailsEn = detailsParts[1] || detailsParts[0] || c.details || '';

        const catParts = (c.category || '').split('|').map(s => s.trim());
        const catHy = catParts[0] || c.category || 'Աշխատանք';

        items.push({
          id: `case-${c.id}`,
          type: 'case',
          title_hy: titleHy,
          title_en: titleEn,
          subtitle_hy: subtitleHy,
          subtitle_en: subtitleEn,
          description_hy: detailsHy,
          description_en: detailsEn,
          url: `/works?case=${encodeURIComponent(c.id)}`,
          image: c.image_url || '',
          category: catHy,
          tags: ['case', 'քեյս', 'աշխատանք', 'work', 'portfolio', c.client || '', c.year || ''].filter(Boolean),
          metadata: {
            bg: c.bg,
            year: c.year,
            client: c.client
          }
        });
      }
    } catch (err) {
      console.warn('Failed to index cases for search:', err);
    }

    // 3. Index Published Fonts
    try {
      const fonts = await getFonts();
      for (const f of fonts) {
        if (!f.font_file_url && !f.download_url && !f.name_am) continue;

        items.push({
          id: `font-${f.id}`,
          type: 'font',
          title_hy: f.name_am || f.name_en || '',
          title_en: f.name_en || f.name_am || '',
          subtitle_hy: `${f.category || 'Տառատեսակ'} • ${f.creator || 'HDesign'}`,
          subtitle_en: `${f.category || 'Font'} • ${f.creator || 'HDesign'}`,
          description_hy: f.description_am || f.description_en || '',
          description_en: f.description_en || f.description_am || '',
          url: `/fonts/${f.id}`,
          image: f.font_file_url || '',
          category: f.category || 'Տառատեսակ',
          tags: ['font', 'տառատեսակ', 'տառ', 'տիպոգրաֆիկա', f.category || '', f.creator || ''].filter(Boolean),
          metadata: {
            year: f.year,
            paid: f.paid,
            price: f.price
          }
        });
      }
    } catch (err) {
      console.warn('Failed to index fonts for search:', err);
    }

    // 4. Index ONLY Published Site Images
    for (const pImg of PUBLISHED_BRANDING_IMAGES) {
      items.push({
        id: pImg.id,
        type: 'image',
        title_hy: pImg.title_hy,
        title_en: pImg.title_en,
        subtitle_hy: pImg.subtitle_hy,
        subtitle_en: pImg.subtitle_en,
        description_hy: `Հրապարակված մեդիա պատկեր: ${pImg.title_hy}`,
        description_en: `Published media image: ${pImg.title_en}`,
        url: pImg.url,
        image: pImg.image,
        category: 'Պատկեր',
        tags: ['image', 'պատկեր', 'նկար', ...pImg.tags]
      });
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      items
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate search index' },
      { status: 500 }
    );
  }
}
