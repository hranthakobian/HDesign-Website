import { getSiteSetting } from './db';

/**
 * Retrieves the correct passcode for admin operations.
 * First checks the database site_settings table/JSON file,
 * then falls back to environment variable, then a default fallback.
 */
export async function getCorrectPasscode(): Promise<string> {
  try {
    const generalSettings = await getSiteSetting('general_settings', {});
    if (generalSettings && generalSettings.admin_passcode) {
      return generalSettings.admin_passcode;
    }
  } catch (err) {
    console.error('Error fetching general_settings for auth:', err);
  }
  return process.env.ADMIN_PASSCODE || 'admin123';
}

/**
 * Verifies if the request contains the correct admin passcode in the Authorization header.
 */
export async function verifyAuth(request: Request): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;
    const correct = await getCorrectPasscode();
    return authHeader === correct;
  } catch (err) {
    console.error('Error verifying auth:', err);
    return false;
  }
}
