import { NextResponse } from 'next/server';
import { getApps, getCases, getFonts } from '@/lib/db';
import { scanAllMediaFiles } from '@/lib/mediaScanner';

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

// Static site pages to include in the index
const STATIC_PAGES: SearchIndexItem[] = [
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
    tags: ['home', 'տուն', 'գլխավոր', 'դիզայն', 'պորտֆոլիո', 'hrant', 'hakobyan']
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
    tags: ['about', 'մասին', 'ռեզյումե', 'resume', 'skills', 'հմտություններ', 'փորձ']
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
    tags: ['branding', 'բրենդինգ', 'լոգո', 'logo', 'փաթեթավորում']
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
    tags: ['design', 'դիզայն', 'պաստառներ', 'posters', 'art', 'արտ', 'պատկերասրահ']
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
    tags: ['fonts', 'տառատեսակներ', 'տառատեսակ', 'font', 'տիպոգրաֆիկա', 'typography']
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
    tags: ['apps', 'հավելվածներ', 'փլագիններ', 'plugins', 'photoshop', 'illustrator', 'tools']
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
    tags: ['hdesign', 'design system', 'համակարգ', 'components', 'բաղադրիչներ']
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
    tags: ['docs', 'փաստաթղթեր', 'hd-button', 'hd-input', 'hd-select', 'hd-switch', 'hd-slider', 'api']
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
    tags: ['samples', 'փորձանմուշներ', 'demo', 'կոմպոնենտներ', 'ui']
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
    tags: ['contact', 'կապ', 'էլ․ հասցե', 'email', 'հաղորդագրություն', 'message']
  }
];

export async function GET() {
  try {
    const items: SearchIndexItem[] = [...STATIC_PAGES];

    // 1. Index Apps
    try {
      const apps = await getApps();
      for (const app of apps) {
        if (app.is_draft || app.status === 'draft') continue;
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
          category: (app as any).category || app.host_app || 'Հավելված',
          tags: [
            'app',
            'հավելված',
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
      console.warn('Failed to index apps for search:', err);
    }

    // 2. Index Cases / Portfolio Works
    try {
      const cases = await getCases();
      for (const c of cases) {
        // Split bilingual titles and subtitles if separated by "|"
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

        // Check if project has an image
        const img = c.image_url || (c.id === 'seed-1' ? '/branding/pasta.png' : 
                                    c.id === 'seed-2' ? '/branding/eleven.png' :
                                    c.id === 'seed-3' ? '/branding/posters.png' :
                                    c.id === 'seed-4' ? '/branding/teal.png' :
                                    c.id === 'seed-5' ? '/branding/mobile.png' : '');

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
          image: img,
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

    // 3. Index Fonts
    try {
      const fonts = await getFonts();
      for (const f of fonts) {
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
          tags: ['font', 'տառատեսակ', f.category || '', f.creator || ''].filter(Boolean),
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

    // 4. Index Images & Media Library Assets
    try {
      const mediaData = await scanAllMediaFiles();
      const files = mediaData.files || [];
      const folders = mediaData.folders || [];
      const folderMap = new Map<string, string>();
      for (const f of folders) {
        folderMap.set(f.id, f.name);
      }

      for (const file of files) {
        if (file.type !== 'image' || file.isTrashed) continue;
        const name = file.name || 'Image';
        const folderName = (file.folderId && folderMap.get(file.folderId)) || 'Մեդիա';

        items.push({
          id: `img-${file.id}`,
          type: 'image',
          title_hy: name,
          title_en: name,
          subtitle_hy: `${file.dimensions ? `${file.dimensions.width}×${file.dimensions.height}px • ` : ''}${file.sizeFormatted || ''}`,
          subtitle_en: `${file.dimensions ? `${file.dimensions.width}×${file.dimensions.height}px • ` : ''}${file.sizeFormatted || ''}`,
          description_hy: `Նիշք: ${file.name} (${folderName})`,
          description_en: `File: ${file.name} (${folderName})`,
          url: file.url,
          image: file.url,
          category: folderName,
          tags: ['image', 'պատկեր', 'նկար', file.extension || '', folderName, ...(file.tags || [])].filter(Boolean),
          metadata: {
            width: file.dimensions?.width,
            height: file.dimensions?.height,
            size: file.size,
            url: file.url
          }
        });
      }
    } catch (err) {
      console.warn('Failed to index media files for search:', err);
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
