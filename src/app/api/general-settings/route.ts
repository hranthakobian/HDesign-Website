import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { getCorrectPasscode, verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const generalSettings = await getSiteSetting('general_settings', {
      upcoming_mode: false,
      upcoming_title_hy: 'Շուտով',
      upcoming_title_en: 'Coming Soon',
      upcoming_desc_hy: 'Մեր կորպորատիվ կայքը ժամանակավորապես անցանց է ստեղծարար փոփոխությունների և նորացման պատճառով։ Շուտով կվերադառնանք նորացված տեսքով։',
      upcoming_desc_en: 'Our website is temporarily offline for maintenance and creative updates. We will be back soon with a fresh experience.',
      upcoming_email: 'info@hdesign.am',
      upcoming_tel: '+374 99 00 00 00'
    });
    
    // Return only public fields without caching
    return NextResponse.json(
      { 
        upcoming_mode: !!generalSettings?.upcoming_mode,
        upcoming_title_hy: generalSettings?.upcoming_title_hy || 'Շուտով',
        upcoming_title_en: generalSettings?.upcoming_title_en || 'Coming Soon',
        upcoming_desc_hy: generalSettings?.upcoming_desc_hy || 'Մեր կորպորատիվ կայքը ժամանակավորապես անցանց է ստեղծարար փոփոխությունների և նորացման պատճառով։ Շուտով կվերադառնանք նորացված տեսքով։',
        upcoming_desc_en: generalSettings?.upcoming_desc_en || 'Our website is temporarily offline for maintenance and creative updates. We will be back soon with a fresh experience.',
        upcoming_email: generalSettings?.upcoming_email || 'info@hdesign.am',
        upcoming_tel: generalSettings?.upcoming_tel || '+374 99 00 00 00'
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        }
      }
    );
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

    // 3. Handle upcoming mode toggle & custom texts
    if (body.upcoming_mode !== undefined) {
      updatedSettings.upcoming_mode = !!body.upcoming_mode;
    }
    if (body.upcoming_title_hy !== undefined) {
      updatedSettings.upcoming_title_hy = body.upcoming_title_hy;
    }
    if (body.upcoming_title_en !== undefined) {
      updatedSettings.upcoming_title_en = body.upcoming_title_en;
    }
    if (body.upcoming_desc_hy !== undefined) {
      updatedSettings.upcoming_desc_hy = body.upcoming_desc_hy;
    }
    if (body.upcoming_desc_en !== undefined) {
      updatedSettings.upcoming_desc_en = body.upcoming_desc_en;
    }
    if (body.upcoming_email !== undefined) {
      updatedSettings.upcoming_email = body.upcoming_email;
    }
    if (body.upcoming_tel !== undefined) {
      updatedSettings.upcoming_tel = body.upcoming_tel;
    }

    // 4. Save to database/fallback
    const result = await saveSiteSetting('general_settings', updatedSettings);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save general settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      passcodeChanged,
      upcoming_mode: updatedSettings.upcoming_mode,
      upcoming_title_hy: updatedSettings.upcoming_title_hy,
      upcoming_title_en: updatedSettings.upcoming_title_en,
      upcoming_desc_hy: updatedSettings.upcoming_desc_hy,
      upcoming_desc_en: updatedSettings.upcoming_desc_en,
      upcoming_email: updatedSettings.upcoming_email,
      upcoming_tel: updatedSettings.upcoming_tel,
      newToken: passcodeChanged ? updatedSettings.admin_passcode : undefined
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
