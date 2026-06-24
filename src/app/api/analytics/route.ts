import { NextResponse } from 'next/server';
import { getVisits } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const correctPasscode = process.env.ADMIN_PASSCODE || 'admin123';
    
    if (authHeader !== correctPasscode) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const visits = await getVisits();
    return NextResponse.json(visits);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics.' },
      { status: 500 }
    );
  }
}
