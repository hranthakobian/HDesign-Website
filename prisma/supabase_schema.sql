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


