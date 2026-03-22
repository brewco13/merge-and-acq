-- CreateEnum
CREATE TYPE "DecisionHorizon" AS ENUM ('TSA_EXPIRATION', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "DispositionType" AS ENUM ('RETAIN', 'RETIRE', 'REPLACE', 'REHOST', 'REPLATFORM', 'REPURCHASE', 'CONSOLIDATE');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "NoteLevel" AS ENUM ('APPLICATION', 'DECISION');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "name" TEXT NOT NULL,
    "businessArea" TEXT,
    "l1Capability" TEXT,
    "l2Capability" TEXT,
    "l3Capability" TEXT,
    "description" TEXT,
    "sourceCompany" TEXT,
    "sourceEnvironment" TEXT,
    "currentState" TEXT,
    "criticality" TEXT,
    "lifecycleStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispositionDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "decisionHorizon" "DecisionHorizon" NOT NULL,
    "targetDate" TIMESTAMP(3),
    "targetDisposition" "DispositionType",
    "status" "DecisionStatus" NOT NULL DEFAULT 'DRAFT',
    "targetPlatform" TEXT,
    "targetTimeline" TEXT,
    "rationale" TEXT,
    "decisionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispositionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionCandidateApplication" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "candidateApplicationId" TEXT NOT NULL,
    "priorityOrder" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionCandidateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ownership" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "businessOwner" TEXT,
    "technicalOwner" TEXT,
    "businessDecisionOwner" TEXT,
    "technicalDecisionOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "dispositionDecisionId" TEXT,
    "noteLevel" "NoteLevel" NOT NULL,
    "author" TEXT,
    "noteType" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_legacyId_key" ON "Application"("legacyId");

-- CreateIndex
CREATE INDEX "Application_name_idx" ON "Application"("name");

-- CreateIndex
CREATE INDEX "Application_businessArea_idx" ON "Application"("businessArea");

-- CreateIndex
CREATE INDEX "Application_l1Capability_l2Capability_l3Capability_idx" ON "Application"("l1Capability", "l2Capability", "l3Capability");

-- CreateIndex
CREATE INDEX "DispositionDecision_applicationId_idx" ON "DispositionDecision"("applicationId");

-- CreateIndex
CREATE INDEX "DispositionDecision_decisionHorizon_idx" ON "DispositionDecision"("decisionHorizon");

-- CreateIndex
CREATE INDEX "DispositionDecision_status_idx" ON "DispositionDecision"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DispositionDecision_applicationId_decisionHorizon_targetDat_key" ON "DispositionDecision"("applicationId", "decisionHorizon", "targetDate");

-- CreateIndex
CREATE INDEX "DecisionCandidateApplication_decisionId_idx" ON "DecisionCandidateApplication"("decisionId");

-- CreateIndex
CREATE INDEX "DecisionCandidateApplication_candidateApplicationId_idx" ON "DecisionCandidateApplication"("candidateApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionCandidateApplication_decisionId_candidateApplicatio_key" ON "DecisionCandidateApplication"("decisionId", "candidateApplicationId");

-- CreateIndex
CREATE INDEX "Ownership_applicationId_idx" ON "Ownership"("applicationId");

-- CreateIndex
CREATE INDEX "Note_applicationId_idx" ON "Note"("applicationId");

-- CreateIndex
CREATE INDEX "Note_dispositionDecisionId_idx" ON "Note"("dispositionDecisionId");

-- AddForeignKey
ALTER TABLE "DispositionDecision" ADD CONSTRAINT "DispositionDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionCandidateApplication" ADD CONSTRAINT "DecisionCandidateApplication_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "DispositionDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionCandidateApplication" ADD CONSTRAINT "DecisionCandidateApplication_candidateApplicationId_fkey" FOREIGN KEY ("candidateApplicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_dispositionDecisionId_fkey" FOREIGN KEY ("dispositionDecisionId") REFERENCES "DispositionDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
