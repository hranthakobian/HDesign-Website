import { NextResponse } from 'next/server';
import { getCorrectPasscode } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    let token = request.headers.get('authorization');
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/hdesign_admin_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const correct = await getCorrectPasscode();
    if (token === correct) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
