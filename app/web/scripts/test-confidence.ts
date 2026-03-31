import { prisma } from '../src/lib/prisma';
import { ConfidenceEngine } from '../src/lib/confidence/confidence-engine';


async function main() {
  const applicationId = '3ae0cca9-776b-4fdf-8b26-6287eeef4def';

  const engine = new ConfidenceEngine(prisma);
  const result = await engine.calculateOnly(applicationId);

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
