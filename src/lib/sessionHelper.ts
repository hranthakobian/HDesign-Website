/**
 * Helper to parse User-Agent strings and extract clean device, OS, and browser info.
 */

export interface ParsedDeviceInfo {
  browser: string;
  os: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  icon: string;
}

export function parseUserAgent(ua: string | null | undefined): ParsedDeviceInfo {
  if (!ua) {
    return {
      browser: 'Անհայտ բրաուզեր',
      os: 'Անհայտ ՕՀ',
      device: 'Անհայտ սարք',
      deviceType: 'unknown',
      icon: 'icon-Monitor'
    };
  }

  const uaLower = ua.toLowerCase();

  // 1. Detect OS
  let os = 'Անհայտ ՕՀ';
  if (uaLower.includes('windows nt 10.0') || uaLower.includes('windows 11') || uaLower.includes('windows nt 11.0')) {
    os = 'Windows 10/11';
  } else if (uaLower.includes('windows nt 6.3')) {
    os = 'Windows 8.1';
  } else if (uaLower.includes('windows nt 6.1')) {
    os = 'Windows 7';
  } else if (uaLower.includes('windows')) {
    os = 'Windows';
  } else if (uaLower.includes('iphone')) {
    os = 'iOS (iPhone)';
  } else if (uaLower.includes('ipad')) {
    os = 'iPadOS (iPad)';
  } else if (uaLower.includes('macintosh') || uaLower.includes('mac os x')) {
    os = 'macOS';
  } else if (uaLower.includes('android')) {
    os = 'Android';
  } else if (uaLower.includes('linux')) {
    os = 'Linux';
  }

  // 2. Detect Browser
  let browser = 'Web Browser';
  if (uaLower.includes('edg/')) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = match ? `Microsoft Edge ${match[1].split('.')[0]}` : 'Microsoft Edge';
  } else if (uaLower.includes('opr/') || uaLower.includes('opera')) {
    const match = ua.match(/OPR\/([\d.]+)/);
    browser = match ? `Opera ${match[1].split('.')[0]}` : 'Opera';
  } else if (uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = match ? `Google Chrome ${match[1].split('.')[0]}` : 'Google Chrome';
  } else if (uaLower.includes('firefox')) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = match ? `Mozilla Firefox ${match[1].split('.')[0]}` : 'Firefox';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = match ? `Safari ${match[1].split('.')[0]}` : 'Apple Safari';
  }

  // 3. Detect Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown' = 'desktop';
  let device = 'Աշխատանքային Համակարգիչ (PC/Desktop)';
  let icon = 'icon-Monitor';

  if (uaLower.includes('ipad') || (uaLower.includes('android') && !uaLower.includes('mobile'))) {
    deviceType = 'tablet';
    device = 'Պլանշետ (Tablet)';
    icon = 'icon-Monitor';
  } else if (uaLower.includes('iphone') || uaLower.includes('mobile')) {
    deviceType = 'mobile';
    device = 'Բջջային Հեռախոս (Mobile)';
    icon = 'icon-Call';
  } else if (os.includes('macOS')) {
    device = 'Mac / MacBook';
    icon = 'icon-Monitor';
  } else if (os.includes('Windows')) {
    device = 'Windows PC';
    icon = 'icon-Monitor';
  }

  return {
    browser,
    os,
    device,
    deviceType,
    icon
  };
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
