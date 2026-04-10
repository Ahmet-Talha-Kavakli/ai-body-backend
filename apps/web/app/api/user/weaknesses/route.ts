import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const weaknesses = await prisma.userWeakness.findMany({
      where: { userId },
      orderBy: { severity: 'desc' },
    });

    return NextResponse.json({ success: true, data: weaknesses });
  } catch (error) {
    console.error('Error fetching weaknesses:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const weakness = await prisma.userWeakness.create({
      data: {
        userId,
        ...body,
      },
    });

    return NextResponse.json({ success: true, data: weakness });
  } catch (error) {
    console.error('Error saving weakness:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
