-- CreateEnum
CREATE TYPE "ConfidenceHorizon" AS ENUM ('TSA', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "ConfidenceBand" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ConfidenceAssessmentStatus" AS ENUM ('SYSTEM_CALCULATED', 'REVIEWED', 'APPROVED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "ConfidenceFactorCode" AS ENUM ('DISPOSITION_DEFINITION', 'EVIDENCE_QUALITY', 'BUSINESS_ALIGNMENT', 'TECHNICAL_ALIGNMENT', 'EXECUTION_READINESS', 'STABILITY_CONSISTENCY');

-- CreateTable
CREATE TABLE "ConfidenceAssessment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "horizonType" "ConfidenceHorizon" NOT NULL,
    "calculatedScore" INTEGER NOT NULL,
    "manualAdjustment" INTEGER NOT NULL DEFAULT 0,
    "finalScore" INTEGER NOT NULL,
    "confidenceBand" "ConfidenceBand" NOT NULL,
    "scoringModelVersion" TEXT NOT NULL,
    "assessmentStatus" "ConfidenceAssessmentStatus" NOT NULL DEFAULT 'SYSTEM_CALCULATED',
    "reviewerName" TEXT,
    "reviewNotes" TEXT,
    "overrideReason" TEXT,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfidenceAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfidenceFactorScore" (
    "id" TEXT NOT NULL,
    "confidenceAssessmentId" TEXT NOT NULL,
    "factorCode" "ConfidenceFactorCode" NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "weightPercent" DECIMAL(5,2) NOT NULL,
    "weightedScore" DECIMAL(6,2) NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfidenceFactorScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConfidenceAssessment_applicationId_idx" ON "ConfidenceAssessment"("applicationId");

-- CreateIndex
CREATE INDEX "ConfidenceAssessment_horizonType_finalScore_idx" ON "ConfidenceAssessment"("horizonType", "finalScore");

-- CreateIndex
CREATE INDEX "ConfidenceAssessment_confidenceBand_idx" ON "ConfidenceAssessment"("confidenceBand");

-- CreateIndex
CREATE UNIQUE INDEX "ConfidenceAssessment_applicationId_horizonType_key" ON "ConfidenceAssessment"("applicationId", "horizonType");

-- CreateIndex
CREATE INDEX "ConfidenceFactorScore_factorCode_idx" ON "ConfidenceFactorScore"("factorCode");

-- CreateIndex
CREATE UNIQUE INDEX "ConfidenceFactorScore_confidenceAssessmentId_factorCode_key" ON "ConfidenceFactorScore"("confidenceAssessmentId", "factorCode");

-- AddForeignKey
ALTER TABLE "ConfidenceAssessment" ADD CONSTRAINT "ConfidenceAssessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfidenceFactorScore" ADD CONSTRAINT "ConfidenceFactorScore_confidenceAssessmentId_fkey" FOREIGN KEY ("confidenceAssessmentId") REFERENCES "ConfidenceAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
