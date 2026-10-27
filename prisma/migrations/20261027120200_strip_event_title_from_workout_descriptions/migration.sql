-- The schedule migration titled each event from the first ';' segment of its
-- workout description but left that segment in place, so schedule cards show it
-- twice. Strip it where it exactly matches the event's title and something
-- follows it; any description that doesn't fit that shape is left alone.
UPDATE "workout" AS w
SET "description" = btrim(substr(w."description", strpos(w."description", ';') + 1))
FROM "event" AS e
WHERE e."workoutId" = w."id"
  AND strpos(w."description", ';') > 0
  AND btrim(split_part(w."description", ';', 1)) = btrim(e."title")
  AND btrim(substr(w."description", strpos(w."description", ';') + 1)) <> '';
