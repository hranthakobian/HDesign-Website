import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();

    const correctPasscode = process.env.ADMIN_PASSCODE || 'admin123';

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
