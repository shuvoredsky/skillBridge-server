-- CreateEnum
CREATE TYPE "TutorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TutorDocumentType" AS ENUM ('DEGREE', 'NID', 'CERTIFICATE');

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationStatus" "TutorVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "TutorDocument" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "type" "TutorDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorDocument_tutorId_type_key" ON "TutorDocument"("tutorId", "type");

-- AddForeignKey
ALTER TABLE "TutorDocument" ADD CONSTRAINT "TutorDocument_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
