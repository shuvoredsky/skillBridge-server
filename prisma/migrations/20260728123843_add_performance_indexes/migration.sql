-- CreateIndex
CREATE INDEX "Availability_tutorId_idx" ON "Availability"("tutorId");

-- CreateIndex
CREATE INDEX "Booking_studentId_date_idx" ON "Booking"("studentId", "date");

-- CreateIndex
CREATE INDEX "Booking_tutorId_date_idx" ON "Booking"("tutorId", "date");

-- CreateIndex
CREATE INDEX "Review_tutorId_createdAt_idx" ON "Review"("tutorId", "createdAt");

-- CreateIndex
CREATE INDEX "TutorProfile_verificationStatus_rating_idx" ON "TutorProfile"("verificationStatus", "rating");
