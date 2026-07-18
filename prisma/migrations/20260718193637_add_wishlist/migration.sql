-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "profilePhoto" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePhoto" TEXT;

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wishlist_studentId_idx" ON "Wishlist"("studentId");

-- CreateIndex
CREATE INDEX "Wishlist_tutorId_idx" ON "Wishlist"("tutorId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_studentId_tutorId_key" ON "Wishlist"("studentId", "tutorId");

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
