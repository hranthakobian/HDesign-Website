import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { 
  getMediaLibraryData, 
  saveMediaLibraryData, 
  moveFilesToTrash, 
  restoreFilesFromTrash, 
  emptyTrash, 
  permanentlyDeleteMediaFile,
  unlinkMediaUsage,
  DEFAULT_TRASH_SETTINGS
} from '@/lib/mediaScanner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const libraryData = await getMediaLibraryData();
    const settings = libraryData.trashSettings || DEFAULT_TRASH_SETTINGS;
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Failed to get trash settings:', error);
    return NextResponse.json({ error: error.message || 'Սխալ աղբարկղի կարգավորումները բեռնելիս' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const body = await request.json();
    const { action, fileIds, settings } = body;

    if (!action) {
      return NextResponse.json({ error: 'Գործողությունը նշված չէ:' }, { status: 400 });
    }

    if (action === 'moveToTrash') {
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return NextResponse.json({ error: 'Ֆայլերը նշված չեն:' }, { status: 400 });
      }
      await moveFilesToTrash(fileIds);
      return NextResponse.json({ success: true, message: 'Նիշքերը տեղափոխվեցին աղբարկղ:' });
    }

    if (action === 'restore') {
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return NextResponse.json({ error: 'Ֆայլերը նշված չեն:' }, { status: 400 });
      }
      await restoreFilesFromTrash(fileIds);
      return NextResponse.json({ success: true, message: 'Նիշքերը հաջողությամբ վերականգնվեցին:' });
    }

    if (action === 'empty') {
      await emptyTrash();
      return NextResponse.json({ success: true, message: 'Աղբարկղը ամբողջությամբ դատարկվեց:' });
    }

    if (action === 'permanentDelete') {
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return NextResponse.json({ error: 'Ֆայլերը նշված չեն:' }, { status: 400 });
      }
      try {
        await unlinkMediaUsage(fileIds);
      } catch (e) {
        console.warn('Error batch unlinking:', e);
      }
      for (const id of fileIds) {
        await permanentlyDeleteMediaFile(id);
      }
      return NextResponse.json({ success: true, message: 'Նիշքերը ընդմիշտ ջնջվեցին:' });
    }

    if (action === 'updateSettings') {
      if (!settings || typeof settings !== 'object') {
        return NextResponse.json({ error: 'Կարգավորումները սխալ են:' }, { status: 400 });
      }
      const libraryData = await getMediaLibraryData();
      libraryData.trashSettings = {
        autoDeleteEnabled: settings.autoDeleteEnabled !== undefined ? Boolean(settings.autoDeleteEnabled) : true,
        retentionDays: Number(settings.retentionDays) > 0 ? Number(settings.retentionDays) : 30
      };
      await saveMediaLibraryData(libraryData);
      return NextResponse.json({ success: true, settings: libraryData.trashSettings });
    }

    return NextResponse.json({ error: 'Անհայտ գործողություն:' }, { status: 400 });
  } catch (error: any) {
    console.error('Trash action failed:', error);
    return NextResponse.json({ error: error.message || 'Գործողությունը ձախողվեց:' }, { status: 500 });
  }
}
