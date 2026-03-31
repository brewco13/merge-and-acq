import { prisma } from '@/lib/prisma';
import { ConfidenceEngine } from '@/lib/confidence/confidence-engine';

const engine = new ConfidenceEngine(prisma);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await engine.calculateOnly(id);
    return Response.json(result);
  } catch (error) {
    console.error('Confidence GET error:', error);
    return new Response('Failed to load confidence', { status: 500 });
  }
}
