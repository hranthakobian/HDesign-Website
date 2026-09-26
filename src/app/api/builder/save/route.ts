import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const SITE_DATA_FILE = path.join(process.cwd(), "src", "config", "site-data.json");
const THEMES_FILE = path.join(process.cwd(), "src", "config", "themes.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteData, activeThemeId, themes } = body;

    let savedData: any = null;

    // 1. Save site data (pages, system pages, templates, instances)
    if (siteData) {
      await fs.writeFile(SITE_DATA_FILE, JSON.stringify(siteData, null, 2), "utf-8");
      savedData = siteData;
    }

    // 2. Save active theme if provided
    if (themes && Array.isArray(themes)) {
      await fs.writeFile(THEMES_FILE, JSON.stringify(themes, null, 2), "utf-8");
    }

    return NextResponse.json({
      success: true,
      message: "Site data and theme configuration saved successfully.",
      data: savedData
    });
  } catch (error: any) {
    console.error("Error saving site data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save site data" },
      { status: 500 }
    );
  }
}
