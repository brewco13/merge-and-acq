-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'REVIEWED', 'SIGNED_OFF');

-- AlterTable
ALTER TABLE "DispositionDecision" ADD COLUMN     "businessReviewStatus" "ReviewStatus" DEFAULT 'NOT_STARTED',
ADD COLUMN     "businessSignoffStatus" "ReviewStatus" DEFAULT 'NOT_STARTED',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "technicalReviewStatus" "ReviewStatus" DEFAULT 'NOT_STARTED',
ADD COLUMN     "technicalSignoffStatus" "ReviewStatus" DEFAULT 'NOT_STARTED';
