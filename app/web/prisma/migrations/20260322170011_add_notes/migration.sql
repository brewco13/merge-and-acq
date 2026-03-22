/*
  Warnings:

  - You are about to drop the column `author` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `noteLevel` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `noteType` on the `Note` table. All the data in the column will be lost.
  - Made the column `applicationId` on table `Note` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_dispositionDecisionId_fkey";

-- DropIndex
DROP INDEX "Note_applicationId_idx";

-- DropIndex
DROP INDEX "Note_dispositionDecisionId_idx";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "author",
DROP COLUMN "noteLevel",
DROP COLUMN "noteType",
ADD COLUMN     "source" TEXT,
ALTER COLUMN "applicationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_dispositionDecisionId_fkey" FOREIGN KEY ("dispositionDecisionId") REFERENCES "DispositionDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
