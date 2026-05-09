-- AlterTable
ALTER TABLE "athlete"
    ADD COLUMN "stravaAccessToken"    TEXT,
    ADD COLUMN "stravaRefreshToken"   TEXT,
    ADD COLUMN "stravaTokenExpiresAt" TIMESTAMP(3),
    ADD COLUMN "stravaAthleteJson"    JSONB,
    ADD COLUMN "stravaConnectedAt"    TIMESTAMP(3);
