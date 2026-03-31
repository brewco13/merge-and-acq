import { prisma } from '@/lib/prisma';
import { ConfidenceEngine } from '@/lib/confidence/confidence-engine';

const engine = new ConfidenceEngine(prisma);

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await engine.calculateAndPersist(id);

    return Response.redirect(
      new URL(`/applications/${id}`, 'http://localhost:3000'),
      303,
    );
  } catch (error) {
    console.error('Confidence recalculate error:', error);
    return new Response('Failed to recalculate confidence', { status: 500 });
  }
}
