import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export type CustomIcon = {
  id: string; // e.g. "icon-CustomStar"
  name_hy: string;
  name_en: string;
  category_hy?: string;
  category_en?: string;
  svg_content?: string;
  image_url?: string;
  created_at?: string;
  is_updated_version?: boolean;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchRemote = searchParams.get('fetch_remote') === 'true';

    let iconsData = await getSiteSetting('custom_icons_settings', {
      custom_icons: []
    });

    if (fetchRemote || !iconsData.custom_icon_css || !iconsData.visual_icon_items || iconsData.visual_icon_items.length === 0) {
      try {
        const remoteRes = await fetch('https://api.hakobian.am/libs/v1/icons/style.css', {
          cache: 'no-store'
        });
        if (remoteRes.ok) {
          const cssText = await remoteRes.text();
          iconsData.custom_icon_css = cssText
            .replace(/url\((['"]?)varFonts\//g, "url($1https://api.hakobian.am/libs/v1/icons/varFonts/")
            .replace(/font-family:\s*['"]HDesign['"]/g, "font-family: 'HDIcons'");
          const regex = /\.([a-zA-Z0-9_-]+):before\s*\{\s*content:\s*["']([^"']+)["']/g;
          let match;
          const visualItems: any[] = [];
          
          const catMap: Record<string, string[]> = {
            "Լոգո և Մենյու": ["HD-Logo", "HD-Logo-Horizontal"],
            "Սլաքներ": [
              "Arrow-Up", "Chevrolt-Arrow-Left", "Chevrolt-Arrow-Right", "Arrow-Left-Up", "Arrow-Right-Up",
              "Arrow-Right", "Arrow-Right-Bottom", "Arrow-Bottom", "Arrow-Left-Bottom", "Arrow-Left",
              "Chevrolt-Arrow-Top", "Chevrolt-Arrow-Bottom", "Undo-Arrow", "Redo-Arrow", "Share-Arrow-Left",
              "Share-Arrow-Right"
            ],
            "Փականներ և Անվտանգություն": ["Locked", "Unlocked", "Close-Eye", "Eye"],
            "Հաղորդակցություն": ["Call", "Mail", "Chat-Bubble", "Two-Chat-Bubble", "Bell", "Notifications", "Send"],
            "Դարան": ["Image", "Camera", "Play", "Stop", "Pause", "Volume-Mute", "Low-Volume", "Medium-Volume", "High-Volume", "Full-Screen", "Expand"]
          };

          const getCat = (iconName: string) => {
            const clean = iconName.replace(/^(hd-icon-|icon-)/i, '');
            for (const [catName, list] of Object.entries(catMap)) {
              if (list.some(l => l.toLowerCase() === clean.toLowerCase())) return catName;
            }
            return "Հիմնական և Գործիքներ";
          };

          while ((match = regex.exec(cssText)) !== null) {
            const iconId = match[1];
            if (!visualItems.some(i => i.id === iconId)) {
              visualItems.push({
                id: iconId,
                category: getCat(iconId),
                unicode: match[2]
              });
            }
          }
          if (visualItems.length > 0) {
            iconsData.visual_icon_items = visualItems;
          }
        }
      } catch (remoteErr) {
        console.warn('Server-side fetch of style.css failed:', remoteErr);
      }
    }

    return NextResponse.json(iconsData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve icon settings.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();

    const currentData = await getSiteSetting('custom_icons_settings', {
      custom_icons: []
    });

    let updatedIcons: CustomIcon[] = [...(currentData.custom_icons || [])];

    if (Array.isArray(body.custom_icons)) {
      updatedIcons = body.custom_icons;
    } else if (body.action === 'add' && body.icon) {
      const existingIdx = updatedIcons.findIndex((i) => i.id === body.icon.id);
      const newIcon: CustomIcon = {
        ...body.icon,
        created_at: body.icon.created_at || new Date().toISOString()
      };
      if (existingIdx >= 0) {
        updatedIcons[existingIdx] = newIcon;
      } else {
        updatedIcons.push(newIcon);
      }
    } else if (body.action === 'delete' && body.id) {
      updatedIcons = updatedIcons.filter((i) => i.id !== body.id);
    } else if (body.action === 'update' && body.icon) {
      const idx = updatedIcons.findIndex((i) => i.id === body.icon.id);
      if (idx >= 0) {
        updatedIcons[idx] = { ...updatedIcons[idx], ...body.icon };
      } else {
        updatedIcons.push({ ...body.icon, created_at: new Date().toISOString() });
      }
    }

    const payloadToSave = {
      ...currentData,
      custom_icons: updatedIcons,
      updated_at: new Date().toISOString()
    };

    if (body.icon_font_css_url !== undefined) {
      payloadToSave.icon_font_css_url = body.icon_font_css_url;
    }
    if (body.icon_font_weights !== undefined) {
      payloadToSave.icon_font_weights = body.icon_font_weights;
    }
    if (body.selection_json !== undefined) {
      payloadToSave.selection_json = body.selection_json;
    }
    if (body.hd_icon_rules !== undefined) {
      payloadToSave.hd_icon_rules = body.hd_icon_rules;
    }
    if (body.custom_icon_css !== undefined) {
      payloadToSave.custom_icon_css = body.custom_icon_css;
    }
    if (body.visual_icon_items !== undefined) {
      payloadToSave.visual_icon_items = body.visual_icon_items;
    }

    const result = await saveSiteSetting('custom_icons_settings', payloadToSave);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save icon settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      custom_icons: updatedIcons,
      icon_font_css_url: payloadToSave.icon_font_css_url,
      icon_font_weights: payloadToSave.icon_font_weights,
      selection_json: payloadToSave.selection_json,
      hd_icon_rules: payloadToSave.hd_icon_rules,
      custom_icon_css: payloadToSave.custom_icon_css,
      visual_icon_items: payloadToSave.visual_icon_items
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
