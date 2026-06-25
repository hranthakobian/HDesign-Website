import { NextResponse } from 'next/server';
import { getVisits } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Auth check
    const isAuthorized = await verifyAuth(request);
    
    if (!isAuthorized) {
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
