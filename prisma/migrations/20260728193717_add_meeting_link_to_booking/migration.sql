-- CreateEnum
CREATE TYPE "MeetingPlatform" AS ENUM ('GOOGLE_MEET', 'ZOOM', 'MS_TEAMS');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meetingLink" TEXT,
ADD COLUMN     "meetingPlatform" "MeetingPlatform";
