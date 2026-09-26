import { NextRequest, NextResponse } from "next/server";
import { loadActiveTheme, setActiveThemeId, scanPhysicalThemes } from "@/lib/theme-loader";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const active = await loadActiveTheme();
    const available = scanPhysicalThemes();

    return NextResponse.json({
      success: true,
      activeThemeId: active.themeId,
      themeClass: active.themeClass,
      themeConfig: active.themeConfig,
      isFallback: active.isFallback,
      availableThemes: available
    });
  } catch (err: any) {
    console.error("[API active theme] GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load active theme" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { themeId } = body;

    if (!themeId) {
      return NextResponse.json(
        { success: false, error: "themeId is required" },
        { status: 400 }
      );
    }

    const result = await setActiveThemeId(themeId);
    const updatedTheme = await loadActiveTheme();

    return NextResponse.json({
      success: true,
      themeId: result.themeId,
      dbUpdated: result.dbUpdated,
      themeConfig: updatedTheme.themeConfig,
      themeClass: updatedTheme.themeClass
    });
  } catch (err: any) {
    console.error("[API active theme] POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to set active theme" },
      { status: 400 }
    );
  }
}
