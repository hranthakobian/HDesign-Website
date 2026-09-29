import { NextResponse } from 'next/server';
import {
  getAppBugReports,
  saveAppBugReport,
  updateAppBugReport,
  deleteAppBugReport,
  getAppById
} from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sendBugReportEmails } from '@/lib/notifications';

// ── GET: Admin list of bug reports ──
export async function GET(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || undefined;
    const status = searchParams.get('status') || undefined;

    let reports = await getAppBugReports(appId);

    if (status && status !== 'all') {
      reports = reports.filter(r => r.status === status);
    }

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bug reports' },
      { status: 500 }
    );
  }
}

// ── POST: Public submission of bug report ──
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      app_id,
      app_title,
      user_name,
      user_email,
      subject,
      description,
      version,
      os,
      media_files
    } = body;

    if (!app_id) {
      return NextResponse.json({ error: 'Հավելվածի նույնացուցիչը (app_id) պարտադիր է:' }, { status: 400 });
    }

    if (!user_email || !user_email.includes('@')) {
      return NextResponse.json({ error: 'Խնդրում ենք մուտքագրել վավեր էլ․ հասցե:' }, { status: 400 });
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Թեման / վերնագիրը պարտադիր է:' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Նկարագրությունը պարտադիր է:' }, { status: 400 });
    }

    // Determine app title
    let resolvedTitle = app_title || '';
    if (!resolvedTitle) {
      try {
        const app = await getAppById(app_id);
        if (app) {
          resolvedTitle = app.title_am || app.title_en || app_id;
        }
      } catch (e) {
        console.warn('Could not fetch app title for bug report:', e);
      }
    }
    if (!resolvedTitle) resolvedTitle = app_id;

    const report = await saveAppBugReport({
      app_id,
      app_title: resolvedTitle,
      user_name: (user_name && user_name.trim()) || 'Անանուն Օգտատեր',
      user_email: user_email.trim().toLowerCase(),
      subject: subject.trim(),
      description: description.trim(),
      version: version ? version.trim() : undefined,
      os: os ? os.trim() : undefined,
      media_files: Array.isArray(media_files) ? media_files : [],
      status: 'new'
    });

    if (!report) {
      return NextResponse.json({ error: 'Չհաջողվեց պահել զեկույցը:' }, { status: 500 });
    }

    // Send emails asynchronously (to admin and confirmation to user)
    try {
      await sendBugReportEmails({
        report,
        appTitle: resolvedTitle
      });
    } catch (emailErr) {
      console.error('Error dispatching bug report emails:', emailErr);
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Ձեր զեկույցը հաջողությամբ ուղարկվեց:'
    });
  } catch (error: any) {
    console.error('Error submitting bug report:', error);
    return NextResponse.json(
      { error: error.message || 'Սերվերի սխալ զեկույցն ուղարկելիս:' },
      { status: 500 }
    );
  }
}

// ── PATCH: Admin status or notes update ──
export async function PATCH(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    const success = await updateAppBugReport(id, updates);
    if (!success) {
      return NextResponse.json({ error: 'Report not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating bug report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update bug report' },
      { status: 500 }
    );
  }
}

// ── DELETE: Admin delete bug report ──
export async function DELETE(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const success = await deleteAppBugReport(id);
    if (!success) {
      return NextResponse.json({ error: 'Report not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting bug report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete bug report' },
      { status: 500 }
    );
  }
}
