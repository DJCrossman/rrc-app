-- AlterTable
ALTER TABLE "athlete"
    ADD COLUMN "concept2AccessToken"    TEXT,
    ADD COLUMN "concept2RefreshToken"   TEXT,
    ADD COLUMN "concept2TokenExpiresAt" TIMESTAMP(3),
    ADD COLUMN "concept2ConnectedAt"    TIMESTAMP(3),
    ADD COLUMN "rcaUsername"            TEXT,
    ADD COLUMN "rcaPassword"            TEXT,
    ADD COLUMN "rcaConnectedAt"         TIMESTAMP(3);
