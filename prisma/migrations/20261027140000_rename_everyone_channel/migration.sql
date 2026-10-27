-- The club-wide channel is addressed by a fixed id; rename it from chan_everyone to everyone.
-- channel_member, channel_read and message cascade on update. If a fresh 'everyone' row was
-- already created by code running ahead of this migration, drop it so the original keeps its history.
DELETE FROM "channel"
WHERE "id" = 'everyone'
  AND EXISTS (SELECT 1 FROM "channel" WHERE "id" = 'chan_everyone');

UPDATE "channel" SET "id" = 'everyone' WHERE "id" = 'chan_everyone';

UPDATE "notification_preference" AS pref
SET "scope" = 'channel:everyone'
WHERE pref."scope" = 'channel:chan_everyone'
  AND NOT EXISTS (
    SELECT 1 FROM "notification_preference" AS existing
    WHERE existing."athleteId" = pref."athleteId" AND existing."scope" = 'channel:everyone'
  );
