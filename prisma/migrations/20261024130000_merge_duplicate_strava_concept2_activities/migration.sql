-- Merge Strava and Concept2 copies of the same piece into one activity row.
--
-- A Concept2 result that the Logbook also pushed to Strava used to be stored
-- twice, once per webhook. Each Strava-only row is paired with the Concept2-only
-- row it duplicates, using the same rules as the inbox processors
-- (src/server/routers/activities/common/cross-source-activity.ts):
--   1. Strava names the result: device_name "Concept2…", external_id "<id>.fit".
--   2. Otherwise: starts within 5 min of either boundary of the other, and
--      distances within 10% (min 100 m). Only unambiguous pairs — each side's
--      single best candidate — are merged.
-- The Strava id, data and title move onto the Concept2 row (which keeps its
-- metrics), and the Strava row is deleted.

-- Hold off concurrent webhook writes until this migration commits.
LOCK TABLE "activity" IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE "_activity_merge_strava" AS
SELECT
    s."id",
    s."athleteId",
    s."startDate",
    s."elapsedTime",
    s."distance",
    CASE
        WHEN lower(s."stravaData" ->> 'device_name') LIKE 'concept2%'
        THEN substring(s."stravaData" ->> 'external_id' FROM '^([0-9]+)(?:\.[fF][iI][tT])?$')::BIGINT
    END AS "linkedConceptTwoId"
FROM "activity" s
WHERE s."stravaId" IS NOT NULL
  AND s."conceptTwoId" IS NULL;

CREATE TEMP TABLE "_activity_merge_pair" (
    "stravaRowId"   TEXT PRIMARY KEY,
    "concept2RowId" TEXT NOT NULL UNIQUE
);

-- 1. Linked by the result id in Strava's external_id.
INSERT INTO "_activity_merge_pair" ("stravaRowId", "concept2RowId")
SELECT DISTINCT ON (c."id") s."id", c."id"
FROM "_activity_merge_strava" s
JOIN "activity" c
  ON c."athleteId" = s."athleteId"
 AND c."conceptTwoId" = s."linkedConceptTwoId"
 AND c."stravaId" IS NULL
ORDER BY c."id", s."id";

-- 2. Matched on time and distance, for Strava rows that don't name a result.
WITH "candidate" AS (
    SELECT
        s."id" AS "stravaRowId",
        c."id" AS "concept2RowId",
        LEAST(
            abs(extract(EPOCH FROM c."startDate" - s."startDate")),
            abs(extract(EPOCH FROM c."startDate" - (s."startDate" + s."elapsedTime" * INTERVAL '1 millisecond'))),
            abs(extract(EPOCH FROM (c."startDate" + c."elapsedTime" * INTERVAL '1 millisecond') - s."startDate"))
        ) AS "timeDiff",
        abs(s."distance" - c."distance") AS "distanceDiff",
        GREATEST(GREATEST(s."distance", c."distance") * 0.1, 100) AS "distanceTolerance"
    FROM "_activity_merge_strava" s
    JOIN "activity" c
      ON c."athleteId" = s."athleteId"
     AND c."conceptTwoId" IS NOT NULL
     AND c."stravaId" IS NULL
     AND c."startDate" BETWEEN s."startDate" - INTERVAL '1 day' AND s."startDate" + INTERVAL '1 day'
    WHERE s."linkedConceptTwoId" IS NULL
      AND c."id" NOT IN (SELECT "concept2RowId" FROM "_activity_merge_pair")
),
"ranked" AS (
    SELECT
        *,
        row_number() OVER (PARTITION BY "stravaRowId" ORDER BY "timeDiff", "distanceDiff", "concept2RowId") AS "stravaRank",
        row_number() OVER (PARTITION BY "concept2RowId" ORDER BY "timeDiff", "distanceDiff", "stravaRowId") AS "concept2Rank"
    FROM "candidate"
    WHERE "timeDiff" <= 300
      AND "distanceDiff" <= "distanceTolerance"
)
INSERT INTO "_activity_merge_pair" ("stravaRowId", "concept2RowId")
SELECT "stravaRowId", "concept2RowId"
FROM "ranked"
WHERE "stravaRank" = 1
  AND "concept2Rank" = 1;

-- Copy the Strava side before deleting it, to free the (athleteId, stravaId)
-- unique slot for the Concept2 row.
CREATE TEMP TABLE "_activity_merge_source" AS
SELECT
    p."concept2RowId",
    s."name",
    s."stravaId",
    s."stravaData",
    s."boatId",
    s."ergId",
    s."workoutId"
FROM "_activity_merge_pair" p
JOIN "activity" s ON s."id" = p."stravaRowId";

DELETE FROM "activity"
WHERE "id" IN (SELECT "stravaRowId" FROM "_activity_merge_pair");

UPDATE "activity" c
SET "name"       = m."name",
    "stravaId"   = m."stravaId",
    "stravaData" = m."stravaData",
    "boatId"     = COALESCE(c."boatId", m."boatId"),
    "ergId"      = COALESCE(c."ergId", m."ergId"),
    "workoutId"  = COALESCE(c."workoutId", m."workoutId"),
    "updatedAt"  = CURRENT_TIMESTAMP
FROM "_activity_merge_source" m
WHERE c."id" = m."concept2RowId";

DROP TABLE "_activity_merge_source";
DROP TABLE "_activity_merge_pair";
DROP TABLE "_activity_merge_strava";
