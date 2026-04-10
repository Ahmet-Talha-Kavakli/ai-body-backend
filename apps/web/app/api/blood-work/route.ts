import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { analyzeBloodWork, parseBloodWorkPDF } from '@/lib/health/blood-work-parser';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  try {
    const results = await parseBloodWorkPDF(file.name);
    const analysis = analyzeBloodWork(results);

    // Save to database
    await prisma.bloodWorkRecord.create({
      data: {
        userId: user.id,
        results: results as any,
        analysis: analysis as any,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json({ results, analysis });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to parse blood work' }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const records = await prisma.bloodWorkRecord.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({ records });
}
