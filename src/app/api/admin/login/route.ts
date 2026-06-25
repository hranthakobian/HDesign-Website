import { NextResponse } from 'next/server';
import { getCorrectPasscode } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();

    const correctPasscode = await getCorrectPasscode();

    if (passcode === correctPasscode) {
      return NextResponse.json({ 
        success: true, 
        token: passcode // use passcode as simple auth token
      });
    }

    return NextResponse.json(
      { error: 'Incorrect passcode. Please try again.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
