export interface SpamCheckInput {
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  landing_page?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type SpamCheckResult = {
  isSpam: boolean;
  reason?: string;
};

// Known keywords in User-Agent that identify scrapers, headless tools, search engines, or command line clients
const SPAM_UA_KEYWORDS = [
  'bot', 'crawler', 'spider', 'scrape', 'headless', 'lighthouse', 'semrush', 'ahrefs',
  'rogerbot', 'mozbar', 'moz.com', 'dotbot', 'screaming', 'siteaudit', 'cybermapper', 'curl', 'wget', 'python',
  'axios', 'go-http', 'java/', 'libwww', 'perl', 'php/', 'httpclient', 'http-client', 'rest-client', 'scrapy', 'postman',
  'insomnia', 'playwright', 'puppeteer', 'selenium', 'phantomjs', 'node-fetch', 'got/',
  'superagent', 'urllib', 'okhttp', 'apache-httpclient', 'github-camo', 'vercel-screenshot',
  'headlesschrome', 'zgrab', 'censys', 'nmap', 'sqlmap', 'masscan', 'netcrawler',
  'exabot', 'sogou', 'baiduspider', 'yandexbot', 'yandeximages', 'yandexsearch', 'facebookexternalhit', 'twitterbot',
  'linkedinbot', 'pinterestbot', 'slackbot', 'telegrambot', 'discordbot', 'applebot'
];

// Typical scan targets for CMS/system exploits, database management pages, configuration dumps, etc.
const SPAM_PATH_KEYWORDS = [
  'wp-admin', 'wp-login', 'wp-content', 'wp-includes', 'xmlrpc', 'wp-config',
  'phpmyadmin', 'setup.php', 'install.php', 'eval-stdin.php', 'info.php', 'phpinfo.php',
  'actuator', '.env', '.git', '.config', 'config.json', 'composer.json', 'package.json',
  'web.config', 'etc/passwd', 'bin/sh', 'cmd.exe', 'mysql', 'sqlmap', 'backup.zip',
  'dump.sql', 'db.sql'
];

// Spam referrer hosts
const SPAM_REFERRER_KEYWORDS = [
  'semalt', 'buttons-for-website', 'darodar', 'best-seo-offer'
];

/**
 * Checks if a single visit session is spam based on request parameters
 */
export function checkIndividualSpam(v: SpamCheckInput): SpamCheckResult {
  const ua = (v.user_agent || '').toLowerCase();
  const path = (v.landing_page || '').toLowerCase();
  const ref = (v.referrer || '').toLowerCase();

  // 1. Missing or empty User-Agent
  if (!ua || ua.trim() === '' || ua === 'unknown') {
    return { isSpam: true, reason: 'Missing or empty User-Agent' };
  }

  // 2. Suspiciously short User-Agent (less than 12 chars), unless it's a known tool like curl
  if (ua.length < 12 && !ua.includes('curl') && !ua.includes('wget')) {
    return { isSpam: true, reason: 'Suspiciously short User-Agent string' };
  }

  // 3. Bot/Crawler keywords in User Agent
  for (const keyword of SPAM_UA_KEYWORDS) {
    if (ua.includes(keyword)) {
      // Return a nice capitalized label for the keyword
      const match = v.user_agent?.match(new RegExp(keyword, 'i'))?.[0] || keyword;
      return { isSpam: true, reason: `Known Bot/Crawler User-Agent: "${match}"` };
    }
  }

  // 4. Exploit / vulnerability scanning paths
  for (const keyword of SPAM_PATH_KEYWORDS) {
    if (path.includes(keyword)) {
      return { isSpam: true, reason: `Exploit scanner path: "${keyword}"` };
    }
  }

  // 5. Request for PHP files (modern JS frameworks don't serve PHP, so scanners hitting these are 100% spam)
  if (path.endsWith('.php') || path.includes('.php?')) {
    return { isSpam: true, reason: 'Request for PHP script file (React/Next.js application)' };
  }

  // 6. Suspicious referrer domains
  for (const keyword of SPAM_REFERRER_KEYWORDS) {
    if (ref.includes(keyword)) {
      return { isSpam: true, reason: `Known spam referrer domain: "${v.referrer}"` };
    }
  }

  return { isSpam: false };
}

/**
 * Classifies an entire array of visits, applying both individual rules and IP-based rate limiting analysis
 */
export function classifyVisits<T extends SpamCheckInput>(visits: T[]): T[] {
  // First pass: Individual static checks
  const classified = visits.map(v => {
    const check = checkIndividualSpam(v);
    return {
      ...v,
      is_spam: check.isSpam,
      spam_reason: check.reason
    };
  });

  // Second pass: IP-based rate limiting (frequency check)
  // Group visits by IP address (ignoring local/unknown IPs)
  const ipCounts: Record<string, { count: number; sessions: Set<string> }> = {};
  
  for (const v of classified) {
    const ip = v.ip_address;
    if (ip && ip !== '127.0.0.1' && ip !== '::1' && ip !== 'unknown') {
      if (!ipCounts[ip]) {
        ipCounts[ip] = { count: 0, sessions: new Set() };
      }
      ipCounts[ip].count++;
      ipCounts[ip].sessions.add(v.session_id);
    }
  }

  // Mark visits from high-frequency spammer IPs as spam
  // e.g. If an IP has > 15 distinct sessions, or > 40 total page hits (events) in the log
  const SPAMMER_IPS = new Set<string>();
  const IP_REASONS: Record<string, string> = {};

  for (const [ip, data] of Object.entries(ipCounts)) {
    if (data.sessions.size > 15) {
      SPAMMER_IPS.add(ip);
      IP_REASONS[ip] = `IP rate limit exceeded: ${data.sessions.size} distinct sessions (suspicious session rotation)`;
    } else if (data.count > 40) {
      SPAMMER_IPS.add(ip);
      IP_REASONS[ip] = `IP rate limit exceeded: ${data.count} hits (abnormally high frequency of requests)`;
    }
  }

  return classified.map(v => {
    if (v.ip_address && SPAMMER_IPS.has(v.ip_address)) {
      return {
        ...v,
        is_spam: true,
        spam_reason: v.spam_reason || IP_REASONS[v.ip_address]
      };
    }
    return v;
  });
}
