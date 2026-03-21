
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type CsvRow = {
  "Business Area"?: string;
  "Master Sheet Applications"?: string;
  "CMDB Tag"?: string;
  "CMDB Active Notes"?: string;
  "Application Description"?: string;
  "ID: LegBASF"?: string;
  L1Capability?: string;
  L2Capability?: string;
  L3Capability?: string;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

function clean(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function main() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    console.error(
      "Usage: node --import tsx scripts/import/import-applications.ts <path-to-csv>"
    );
    process.exit(1);
  }

  const csvPath = path.resolve(fileArg);

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf8");

  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    trim: true,
  }) as CsvRow[];

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = clean(row["Master Sheet Applications"]);
    const legacyId = clean(row["ID: LegBASF"]);
    const businessArea = clean(row["Business Area"]);
    const description = clean(row["Application Description"]);
    const l1Capability = clean(row["L1Capability"]);
    const l2Capability = clean(row["L2Capability"]);
    const l3Capability = clean(row["L3Capability"]);

    if (!name) {
      skipped++;
      console.warn("Skipped row with no application name:", row);
      continue;
    }

    if (legacyId) {
      const existing = await prisma.application.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      await prisma.application.upsert({
        where: { legacyId },
        update: {
          name,
          businessArea,
          description,
          l1Capability,
          l2Capability,
          l3Capability,
        },
        create: {
          legacyId,
          name,
          businessArea,
          description,
          l1Capability,
          l2Capability,
          l3Capability,
        },
      });

      if (existing) {
        updated++;
      } else {
        created++;
      }
    } else {
      await prisma.application.create({
        data: {
          name,
          businessArea,
          description,
          l1Capability,
          l2Capability,
          l3Capability,
        },
      });

      created++;
    }
  }

  console.log("Import complete");
  console.log({
    created,
    updated,
    skipped,
    totalRows: rows.length,
  });
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
