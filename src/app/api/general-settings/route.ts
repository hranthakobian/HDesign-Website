import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { getCorrectPasscode, verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const generalSettings = await getSiteSetting('general_settings', {
      upcoming_mode: false
    });
    
    // Return only public fields
    return NextResponse.json({
      upcoming_mode: !!generalSettings?.upcoming_mode
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Basic auth check (must be logged in)
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const currentPasscode = await getCorrectPasscode();
    const body = await request.json();
    
    const currentSettings = await getSiteSetting('general_settings', {
      admin_passcode: currentPasscode,
      upcoming_mode: false
    });

    const updatedSettings = { ...currentSettings };
    let passcodeChanged = false;

    // 2. Handle passcode update if requested
    if (body.new_passcode) {
      const { current_passcode, new_passcode } = body;
      
      if (!current_passcode || !new_passcode) {
        return NextResponse.json(
          { error: 'Both current and new passcodes are required.' },
          { status: 400 }
        );
      }

      if (current_passcode !== currentPasscode) {
        return NextResponse.json(
          { error: 'The current passcode is incorrect.' },
          { status: 400 }
        );
      }

      if (new_passcode.trim().length < 4) {
        return NextResponse.json(
          { error: 'New passcode must be at least 4 characters long.' },
          { status: 400 }
        );
      }

      updatedSettings.admin_passcode = new_passcode.trim();
      passcodeChanged = true;
    }

    // 3. Handle upcoming mode toggle
    if (body.upcoming_mode !== undefined) {
      updatedSettings.upcoming_mode = !!body.upcoming_mode;
    }

    // 4. Save to database/fallback
    const success = await saveSiteSetting('general_settings', updatedSettings);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save general settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      passcodeChanged,
      upcoming_mode: updatedSettings.upcoming_mode,
      // If passcode changed, return the new passcode so the client can update its session token
      newToken: passcodeChanged ? updatedSettings.admin_passcode : undefined
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
