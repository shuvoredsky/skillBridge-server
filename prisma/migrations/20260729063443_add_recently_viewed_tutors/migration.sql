-- CreateTable
CREATE TABLE "RecentlyViewedTutor" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentlyViewedTutor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecentlyViewedTutor_studentId_viewedAt_idx" ON "RecentlyViewedTutor"("studentId", "viewedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RecentlyViewedTutor_studentId_tutorId_key" ON "RecentlyViewedTutor"("studentId", "tutorId");

-- AddForeignKey
ALTER TABLE "RecentlyViewedTutor" ADD CONSTRAINT "RecentlyViewedTutor_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentlyViewedTutor" ADD CONSTRAINT "RecentlyViewedTutor_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
