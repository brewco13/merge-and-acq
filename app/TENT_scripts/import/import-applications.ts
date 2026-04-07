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

type ImportMode = "validate" | "dry-run" | "upsert";

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


function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

type ImportMode = "validate" | "dry-run" | "upsert";

function getMode(): ImportMode {
  const modeArg = getArgValue("--mode");

  if (!modeArg) return "upsert";
  if (modeArg === "validate" || modeArg === "dry-run" || modeArg === "upsert") {
    return modeArg;
  }

  throw new Error(
    `Invalid --mode value "${modeArg}". Expected validate, dry-run, or upsert.`
  );
}

async function main() {

  console.log("IMPORT SCRIPT VERSION B");

  const fileArg = getArgValue("--file");
  const mode = getMode();

  console.log({ argv: process.argv, fileArg, mode });

  if (!fileArg) {
    console.error(
      "Usage: npx tsx <script-path> --file <path-to-csv> [--mode validate|dry-run|upsert]"
    );
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
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
  let validationOnly = 0;
  let dryRunCount = 0;
  let errors = 0;

  const seenLegacyIds = new Set<string>();

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2; // header row is line 1

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
      console.warn(`Row ${rowNumber}: skipped - no application name`);
      continue;
    }

    if (!legacyId) {
      skipped++;
      console.warn(`Row ${rowNumber}: skipped - no legacyId for "${name}"`);
      continue;
    }

    if (seenLegacyIds.has(legacyId)) {
      skipped++;
      console.warn(
        `Row ${rowNumber}: skipped - duplicate legacyId "${legacyId}" in input file`
      );
      continue;
    }

    seenLegacyIds.add(legacyId);

    if (mode === "validate") {
      validationOnly++;
      continue;
    }

    try {
      if (mode === "dry-run") {
        const existing = await prisma.application.findUnique({
          where: { legacyId },
          select: { id: true },
        });

        if (existing) {
          updated++;
        } else {
          created++;
        }

        if (businessOwner || technicalOwner) {
          dryRunCount++;
        }

        continue;
      }

      await prisma.$transaction(async (tx) => {
        const existing = await tx.application.findUnique({
          where: { legacyId },
          select: { id: true },
        });

        const application = await tx.application.upsert({
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

        if (businessOwner || technicalOwner) {
          const existingOwnershipCount = await tx.ownership.count({
            where: { applicationId: application.id },
          });

          await tx.ownership.deleteMany({
            where: { applicationId: application.id },
          });

          await tx.ownership.create({
            data: {
              applicationId: application.id,
              businessOwner,
              technicalOwner,
            },
          });

          if (existingOwnershipCount > 0) {
            ownershipUpdated++;
          } else {
            ownershipCreated++;
          }
        }
      });
    } catch (error) {
      errors++;
      console.error(`Row ${rowNumber}: import failed`, error);
    }
  }

  console.log("Import complete");
  console.log({
    mode,
    created,
    updated,
    skipped,
    ownershipCreated,
    ownershipUpdated,
    validationOnly,
    dryRunCount,
    errors,
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
