-- SQL Schema Initialization for Minima Infobae
-- Run this script in the Supabase SQL Editor

-- 1. Create Countries Table
CREATE TABLE IF NOT EXISTS countries (
    id VARCHAR(10) PRIMARY KEY, -- 'CO', 'MX', etc.
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    weather_city VARCHAR(150),
    currency_pair VARCHAR(20) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Create RSS Feeds Table
CREATE TABLE IF NOT EXISTS rss_feeds (
    id SERIAL PRIMARY KEY,
    country_id VARCHAR(10) REFERENCES countries(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE, -- Can be NULL for general country feeds
    url TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guid TEXT UNIQUE NOT NULL, -- Unique RSS item key (prevents duplicates)
    country_id VARCHAR(10) REFERENCES countries(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    deck TEXT,
    content TEXT,
    link TEXT NOT NULL,
    image_url TEXT,
    author VARCHAR(255),
    published_at TIMESTAMPTZ NOT NULL,
    trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_articles_country ON articles(country_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);

-- Enable Row Level Security (RLS) on Articles (Optional, default public read is easier for read-only static frontends)
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create Policies for public read-only access (anyone can view, but only authenticated service role can edit)
CREATE POLICY "Public Read Access Countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public Read Access Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access Feeds" ON rss_feeds FOR SELECT USING (true);
CREATE POLICY "Public Read Access Articles" ON articles FOR SELECT USING (true);

-- Seed Initial Countries
INSERT INTO countries (id, name, slug, weather_city, currency_pair) 
VALUES 
('CO', 'Colombia', 'colombia', 'Bogotá, Colombia', 'USDCOP'),
('MX', 'México', 'mexico', 'CDMX, México', 'USDMXN')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  slug = EXCLUDED.slug, 
  weather_city = EXCLUDED.weather_city, 
  currency_pair = EXCLUDED.currency_pair;

-- Seed Initial Categories
INSERT INTO categories (name, slug) 
VALUES 
('General', 'general'),
('Política', 'politica'),
('Deportes', 'deportes'),
('Entretenimiento', 'entretenimiento'),
('Tecnología', 'tecnologia'),
('Economía', 'economia')
ON CONFLICT (name) DO NOTHING;

-- Seed Initial RSS Feeds
-- We map these feeds to countries. Categories are resolved dynamically or map general feeds.
INSERT INTO rss_feeds (country_id, category_id, url)
VALUES 
('CO', NULL, 'https://www.infobae.com/arc/outboundfeeds/rss/category/colombia/'),
('MX', NULL, 'https://www.infobae.com/arc/outboundfeeds/rss/category/mexico/')
ON CONFLICT (url) DO NOTHING;

-- Create Subscribers Table for newsletter subscriptions
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    country_id VARCHAR(2) REFERENCES countries(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert their emails (Subscribe)
CREATE POLICY "Allow public insert subscribers" ON subscribers FOR INSERT WITH CHECK (true);

-- Policy: Protect emails by only allowing service_role (Admin) to view them
CREATE POLICY "Service role read access subscribers" ON subscribers FOR SELECT TO service_role USING (true);
