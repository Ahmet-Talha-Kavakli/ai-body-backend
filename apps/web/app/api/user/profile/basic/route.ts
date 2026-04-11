import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';
import { profileUpdateSchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
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
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profile = await prisma.userBasicProfile.upsert({
      where: { userId },
      update: parsed.data as Parameters<typeof prisma.userBasicProfile.update>[0]['data'],
      create: { userId, ...parsed.data } as Parameters<typeof prisma.userBasicProfile.create>[0]['data'],
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error saving basic profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
