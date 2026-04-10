import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await prisma.userBasicProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching basic profile:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const profile = await prisma.userBasicProfile.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error saving basic profile:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
