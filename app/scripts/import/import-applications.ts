
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
  "Business Owner Sign-Off Representative"?: string;
  "Business Owner Sign-off Acknowledgement"?: string;
  "Technical Owner Sign-Off Representative"?: string;
  "Technical Owner Sign-off Acknowledgement"?: string;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
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
      "Usage: node --import tsx <script-path> <path-to-csv>"
    );
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), fileArg);

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
  let ownershipCreated = 0;
  let ownershipUpdated = 0;

  for (const row of rows) {
    const name = clean(row["Master Sheet Applications"]);
    const legacyId = clean(row["ID: LegBASF"]);
    const businessArea = clean(row["Business Area"]);
    const description = clean(row["Application Description"]);
    const l1Capability = clean(row["L1Capability"]);
    const l2Capability = clean(row["L2Capability"]);
    const l3Capability = clean(row["L3Capability"]);
    const businessOwner = clean(row["Business Owner Sign-Off Representative"]);
    const technicalOwner = clean(row["Technical Owner Sign-Off Representative"]);

    if (!name) {
      skipped++;
      console.warn("Skipped row with no application name:", row);
      continue;
    }

    let application;

    if (legacyId) {
      const existing = await prisma.application.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      application = await prisma.application.upsert({
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
      application = await prisma.application.create({
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

    if (businessOwner || technicalOwner) {
      const existingOwnership = await prisma.ownership.findFirst({
        where: { applicationId: application.id },
        orderBy: { createdAt: "asc" },
      });

      if (existingOwnership) {
        await prisma.ownership.update({
          where: { id: existingOwnership.id },
          data: {
            businessOwner,
            technicalOwner,
          },
        });

        ownershipUpdated++;
      } else {
        await prisma.ownership.create({
          data: {
            applicationId: application.id,
            businessOwner,
            technicalOwner,
          },
        });

        ownershipCreated++;
      }
    }
  }

  console.log("Import complete");
  console.log({
    created,
    updated,
    skipped,
    ownershipCreated,
    ownershipUpdated,
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
