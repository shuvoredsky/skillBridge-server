-- CreateIndex
CREATE UNIQUE INDEX "Booking_tutorId_date_startTime_active_unique" ON "Booking"("tutorId", "date", "startTime") WHERE "status" != 'CANCELLED';