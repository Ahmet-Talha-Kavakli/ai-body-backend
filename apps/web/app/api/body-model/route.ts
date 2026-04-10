import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await prisma.userBodyModel.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ body: body ?? { userId: user.id, fitnessLevel: 'beginner' } });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const data = await req.json();
  const body = await prisma.userBodyModel.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json({ body });
}
