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
      upcoming_tel: '+374 99 00 00 00',
      contact_email: 'hrant@hakobian.am',
      contact_tel: '+374 00 000000',
      contact_address_hy: 'Երևան, Հայաստան',
      contact_address_en: 'Yerevan, Armenia'
    });
    
    const sanitizeVideoUrl = (url?: string) => {
      if (!url || url.includes('/uploads/') || url.includes('1784817997323')) {
        return 'https://api.hakobian.am/libs/v1/promo/promo.mp4';
      }
      return url;
    };

    // Return only public fields without caching
    return NextResponse.json(
      { 
        upcoming_mode: !!generalSettings?.upcoming_mode,
        upcoming_title_hy: generalSettings?.upcoming_title_hy || 'Շուտով',
        upcoming_title_en: generalSettings?.upcoming_title_en || 'Coming Soon',
        upcoming_desc_hy: generalSettings?.upcoming_desc_hy || 'Մեր կորպորատիվ կայքը ժամանակավորապես անցանց է ստեղծարար փոփոխությունների և նորացման պատճառով։ Շուտով կվերադառնանք նորացված տեսքով։',
        upcoming_desc_en: generalSettings?.upcoming_desc_en || 'Our website is temporarily offline for maintenance and creative updates. We will be back soon with a fresh experience.',
        upcoming_email: generalSettings?.upcoming_email || 'info@hdesign.am',
        upcoming_tel: generalSettings?.upcoming_tel || '+374 99 00 00 00',
        contact_email: generalSettings?.contact_email || 'hrant@hakobian.am',
        contact_tel: generalSettings?.contact_tel || '+374 00 000000',
        contact_address_hy: generalSettings?.contact_address_hy || 'Երևան, Հայաստան',
        contact_address_en: generalSettings?.contact_address_en || 'Yerevan, Armenia',
        site_font_url: generalSettings?.site_font_url || 'https://api.hakobian.am/libs/v1/fonts/hdesign.ttf',
        site_font_name: generalSettings?.site_font_name || 'HDesign',
        site_font_weights: generalSettings?.site_font_weights || {},
        design_system_video_hy: sanitizeVideoUrl(generalSettings?.design_system_video_hy),
        design_system_video_en: sanitizeVideoUrl(generalSettings?.design_system_video_en),
        design_system_poster_hy: generalSettings?.design_system_poster_hy || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        design_system_poster_en: generalSettings?.design_system_poster_en || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
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
    if (body.contact_email !== undefined) {
      updatedSettings.contact_email = body.contact_email;
    }
    if (body.contact_tel !== undefined) {
      updatedSettings.contact_tel = body.contact_tel;
    }
    if (body.contact_address_hy !== undefined) {
      updatedSettings.contact_address_hy = body.contact_address_hy;
    }
    if (body.contact_address_en !== undefined) {
      updatedSettings.contact_address_en = body.contact_address_en;
    }
    if (body.site_font_url !== undefined) {
      updatedSettings.site_font_url = body.site_font_url;
    }
    if (body.site_font_name !== undefined) {
      updatedSettings.site_font_name = body.site_font_name;
    }
    if (body.site_font_weights !== undefined) {
      updatedSettings.site_font_weights = body.site_font_weights;
    }
    if (body.design_system_video_hy !== undefined) {
      updatedSettings.design_system_video_hy = body.design_system_video_hy;
    }
    if (body.design_system_video_en !== undefined) {
      updatedSettings.design_system_video_en = body.design_system_video_en;
    }
    if (body.design_system_poster_hy !== undefined) {
      updatedSettings.design_system_poster_hy = body.design_system_poster_hy;
    }
    if (body.design_system_poster_en !== undefined) {
      updatedSettings.design_system_poster_en = body.design_system_poster_en;
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
      contact_email: updatedSettings.contact_email,
      contact_tel: updatedSettings.contact_tel,
      contact_address_hy: updatedSettings.contact_address_hy,
      contact_address_en: updatedSettings.contact_address_en,
      site_font_url: updatedSettings.site_font_url,
      site_font_name: updatedSettings.site_font_name,
      design_system_video_hy: updatedSettings.design_system_video_hy,
      design_system_video_en: updatedSettings.design_system_video_en,
      design_system_poster_hy: updatedSettings.design_system_poster_hy,
      design_system_poster_en: updatedSettings.design_system_poster_en,
      newToken: passcodeChanged ? updatedSettings.admin_passcode : undefined
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
