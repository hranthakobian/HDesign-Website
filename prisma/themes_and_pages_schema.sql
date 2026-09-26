-- ==============================================================================
-- Supabase SQL Schema for HDesign Primary Theme & Site Builder (Updated)
-- ==============================================================================
-- Run these statements in your Supabase SQL Editor (SQL Editor -> New Query).
-- This will ensure your Supabase database has the authentic white-background theme,
-- correct typography, full palette, and all 4 dynamic pages (index, about, works, contact).

-- 1. Create Site Settings Table (with active_theme_id defaulting to 'default-minimal')
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  active_theme_id TEXT NOT NULL DEFAULT 'default-minimal',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial default setting
INSERT INTO public.site_settings (id, active_theme_id)
VALUES ('global', 'default-minimal')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Themes Table (if not exists)
CREATE TABLE IF NOT EXISTS public.themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  author TEXT DEFAULT 'HDesign Studio (Hrant Hakobyan)',
  preview_image TEXT,
  is_active BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  supported_blocks JSONB DEFAULT $$["hero", "branding", "about", "works", "video", "playground", "icons", "glyphs", "features", "text", "container", "contact", "cta", "footer"]$$::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Pages Table (if not exists)
CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  theme_id TEXT REFERENCES public.themes(id) ON DELETE SET NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Row Level Security (RLS) Configuration for Supabase
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-write on site_settings" ON public.site_settings;
CREATE POLICY "Allow public read-write on site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on themes" ON public.themes;
CREATE POLICY "Allow public read-write on themes" ON public.themes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on pages" ON public.pages;
CREATE POLICY "Allow public read-write on pages" ON public.pages FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_themes_is_active ON public.themes(is_active);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_theme ON public.pages(theme_id);

-- 4. Remove any old secondary themes if they exist
DELETE FROM public.themes WHERE id IN ('minimal', 'elegant');

-- 5. Insert or Update Primary Theme: HDesign Original (White Background #ffffff & Dark Text #0f172a)
INSERT INTO public.themes (id, name, description, version, author, is_active, settings, supported_blocks)
VALUES (
  'default',
  'HDesign Original (Հիմնական Թեմա)',
  'HDesign-ի պաշտոնական իրական դիզայնը՝ հայերեն տիպոգրաֆիկայով, ալիքաձև վերնագրով, բրենդինգի քեյսերով, պրոֆիլով և ժամանակակից սպիտակ ֆոնով:',
  '1.0.0',
  'HDesign Studio (Hrant Hakobyan)',
  true,
  $${
    "primary_color": "#083f39",
    "accent_color": "#14b8a6",
    "bg_color": "#ffffff",
    "text_color": "#0f172a",
    "logo_text": "HDesign",
    "logo_url": "",
    "header_sticky": true,
    "header_style": "glass",
    "footer_text": "© 2026 HDesign. Բոլոր իրավունքները պաշտպանված են:"
  }$$::jsonb,
  $$["hero", "branding", "about", "works", "video", "playground", "icons", "glyphs", "features", "text", "container", "contact", "cta", "footer"]$$::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  author = EXCLUDED.author,
  is_active = EXCLUDED.is_active,
  settings = EXCLUDED.settings,
  supported_blocks = EXCLUDED.supported_blocks,
  updated_at = timezone('utc'::text, now());

-- 6. Insert or Update Page 1: Գլխավոր Էջ (Home)
INSERT INTO public.pages (id, slug, title, theme_id, is_published, blocks)
VALUES (
  'page-home',
  'index',
  'Գլխավոր Էջ (Home)',
  'default',
  true,
  $$[
    {
      "id": "block-hero-01",
      "type": "hero",
      "hidden": false,
      "settings": {
        "line1": "ՍՏԵՂԾԱ",
        "line2": "ԵՒ ԳՈՐԾՆԱԿԱՆ",
        "quote": "«Ամեն ոք չի կարող մեծ վարպետ դառնալ, բայց մեծ վարպետը կարող է գալ ամենուրից»",
        "signature_url": "/signature.png"
      }
    },
    {
      "id": "block-branding-01",
      "type": "branding",
      "hidden": false,
      "settings": {
        "title": "ԲՐԵՆԴԻՆԳ",
        "title_en": "Branding"
      }
    },
    {
      "id": "block-about-01",
      "type": "about",
      "hidden": false,
      "settings": {
        "title": "Մասին",
        "title_en": "About",
        "author_name": "Հրանտ Հակոբյան",
        "author_role": "Հիմնադիր & Lead Designer",
        "image_url": "/profile_hrant.jpg",
        "bio": "Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։",
        "btn_text": "Ավելին"
      }
    },
    {
      "id": "block-works-01",
      "type": "works",
      "hidden": false,
      "settings": {
        "title": "Այլ աշխատանքներ",
        "title_en": "Other Works",
        "btn_text": "Ավելի"
      }
    },
    {
      "id": "block-video-01",
      "type": "video",
      "hidden": false,
      "settings": {
        "title": "Պրոմո Տեսանյութ",
        "subtitle": "Ծանոթացեք HDesign ստուդիայի դիզայնի համակարգին",
        "video_url": "https://api.hakobian.am/libs/v1/promo/promo.mp4",
        "video_poster": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
      }
    },
    {
      "id": "block-playground-01",
      "type": "playground",
      "hidden": false,
      "settings": {
        "title": "Դիզայնի Համակարգը",
        "badge": "ԲԵՏԱ",
        "subtitle": "Տառատեսակի Թեսթեր և Կառավարման Գործիքներ"
      }
    },
    {
      "id": "block-icons-01",
      "type": "icons",
      "hidden": false,
      "settings": {
        "title": "Ստուդիայի Պատկերակներ",
        "subtitle": "50+ հատուկ SVG պատկերակների համակարգ և QR գեներատոր"
      }
    },
    {
      "id": "block-glyphs-01",
      "type": "glyphs",
      "hidden": false,
      "settings": {
        "title": "Հայերեն Գրանշաններ",
        "subtitle": "Հայկական գրանշանների, կցագրերի (ﬓ, ﬔ, ﬕ) և դրամի նշանի (֏) քարտեզ"
      }
    }
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  theme_id = EXCLUDED.theme_id,
  blocks = EXCLUDED.blocks,
  updated_at = timezone('utc'::text, now());

-- 7. Insert or Update Page 2: Մասին (About)
INSERT INTO public.pages (id, slug, title, theme_id, is_published, blocks)
VALUES (
  'page-about',
  'about',
  'Մասին (About)',
  'default',
  true,
  $$[
    {
      "id": "block-about-main",
      "type": "about",
      "hidden": false,
      "settings": {
        "title": "Ստուդիայի Մասին",
        "title_en": "About Studio",
        "author_name": "Հրանտ Հակոբյան",
        "author_role": "Հիմնադիր & Lead Designer",
        "image_url": "/profile_hrant.jpg",
        "bio": "Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։",
        "btn_text": "Կապ"
      }
    },
    {
      "id": "block-features-about",
      "type": "features",
      "hidden": false,
      "settings": {
        "title": "Սկզբունքներ և Ուղղություններ",
        "subtitle": "Ինչպես ենք ստեղծում բացառիկ տեսողական արդյունք",
        "items": [
          {
            "icon": "icon-Pattern",
            "title": "Ճշգրիտ Գրաֆիկա",
            "desc": "Մաթեմատիկական հստակություն և էսթետիկա:"
          },
          {
            "icon": "icon-Monitor",
            "title": "Ինտուիտիվ UI/UX",
            "desc": "Մտածված փոխազդեցություն օգտատիրոջ հետ:"
          },
          {
            "icon": "icon-Dashboard",
            "title": "Հայկական Տառատեսակներ",
            "desc": "Ժամանակակից հայերեն տիպոգրաֆիկա:"
          }
        ]
      }
    }
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  theme_id = EXCLUDED.theme_id,
  blocks = EXCLUDED.blocks,
  updated_at = timezone('utc'::text, now());

-- 8. Insert or Update Page 3: Աշխատանքներ (Works)
INSERT INTO public.pages (id, slug, title, theme_id, is_published, blocks)
VALUES (
  'page-works',
  'works',
  'Աշխատանքներ (Works)',
  'default',
  true,
  $$[
    {
      "id": "block-branding-works",
      "type": "branding",
      "hidden": false,
      "settings": {
        "title": "ԲՐԵՆԴԻՆԳԻ ՆԱԽԱԳԾԵՐ",
        "title_en": "Branding Projects"
      }
    },
    {
      "id": "block-works-grid",
      "type": "works",
      "hidden": false,
      "settings": {
        "title": "Ընտրված Քեյսեր",
        "title_en": "Selected Cases",
        "btn_text": "Դիտել բոլորը"
      }
    }
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  theme_id = EXCLUDED.theme_id,
  blocks = EXCLUDED.blocks,
  updated_at = timezone('utc'::text, now());

-- 9. Insert or Update Page 4: Կապ (Contact)
INSERT INTO public.pages (id, slug, title, theme_id, is_published, blocks)
VALUES (
  'page-contact',
  'contact',
  'Կապ (Contact)',
  'default',
  true,
  $$[
    {
      "id": "block-contact-text",
      "type": "text",
      "hidden": false,
      "settings": {
        "title": "Կապվեք Մեզ Հետ",
        "content": "Պատրա՞ստ եք սկսել Ձեր հաջորդ նախագիծը: Ուղարկեք մեզ հաղորդագրություն կամ գրեք մեր էլ. հասցեին:"
      }
    }
  ]$$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  theme_id = EXCLUDED.theme_id,
  blocks = EXCLUDED.blocks,
  updated_at = timezone('utc'::text, now());
