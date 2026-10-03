-- SQL Schema for HDesign Website Admin Dashboard & Analytics
-- Copy and run these statements in your Supabase SQL Editor.

-- 1. Cases (Portfolio projects)
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  bg TEXT NOT NULL,
  image_url TEXT,
  details TEXT,
  category TEXT,
  client TEXT,
  year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) or leave public for simplicity
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;

-- 2. Messages (Contact submissions)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 3. Site Visits (Visitor tracking and analytics)
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  landing_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE site_visits DISABLE ROW LEVEL SECURITY;

-- Create index for quick session-based lookups
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON site_visits(session_id);

-- 4. Site Settings (Translations and API settings)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- 5. Fonts (Custom fonts list)
CREATE TABLE IF NOT EXISTS fonts (
  id TEXT PRIMARY KEY,
  name_am TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  creator TEXT,
  year TEXT,
  description_am TEXT,
  description_en TEXT,
  downloadable BOOLEAN DEFAULT true,
  paid BOOLEAN DEFAULT false,
  price TEXT,
  font_file_url TEXT NOT NULL,
  download_url TEXT,
  purchase_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE fonts DISABLE ROW LEVEL SECURITY;


-- 6. Subscribers (Newsletter subscription list)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;

-- 7. Apps / Plugins
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  title_am TEXT NOT NULL,
  title_en TEXT NOT NULL,
  short_desc_am TEXT,
  short_desc_en TEXT,
  description_md_am TEXT,
  description_md_en TEXT,
  host_app TEXT NOT NULL,
  host_app_icon TEXT,
  app_type TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AMD',
  download_url TEXT,
  store_url TEXT,
  cover_image TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '["Հայերեն", "English"]'::jsonb,
  version TEXT DEFAULT 'v1.0.0',
  release_date TEXT,
  downloads_count INTEGER DEFAULT 0,
  is_draft BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE apps DISABLE ROW LEVEL SECURITY;

-- Migration helpers if table already exists (add new columns first)
ALTER TABLE apps ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["Հայերեն", "English"]'::jsonb;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE apps ADD COLUMN IF NOT EXISTS downloads JSONB DEFAULT '[]'::jsonb;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS supported_os JSONB DEFAULT '[]'::jsonb;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS repository_url TEXT DEFAULT '';
ALTER TABLE apps ADD COLUMN IF NOT EXISTS repository_type TEXT DEFAULT 'github';
ALTER TABLE apps ALTER COLUMN title_am DROP NOT NULL;
ALTER TABLE apps ALTER COLUMN title_en DROP NOT NULL;
ALTER TABLE apps ALTER COLUMN host_app DROP NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_apps_type ON apps(app_type);
CREATE INDEX IF NOT EXISTS idx_apps_host ON apps(host_app);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);

-- 8. App Reviews & Ratings
CREATE TABLE IF NOT EXISTS app_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_reviews DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviews_app ON app_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON app_reviews(status);

-- 9. App Bug Reports (Վրեպների Զեկույցներ)
CREATE TABLE IF NOT EXISTS app_bug_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  app_title TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT,
  os TEXT,
  media_files JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_bug_reports DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bug_reports_app ON app_bug_reports(app_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON app_bug_reports(status);
