-- AlterTable
ALTER TABLE "activity" ALTER COLUMN "id" SET DEFAULT generate_id('act_');

-- AlterTable
ALTER TABLE "athlete" ALTER COLUMN "id" SET DEFAULT generate_id('ath_');

-- AlterTable
ALTER TABLE "boat" ALTER COLUMN "id" SET DEFAULT generate_id('boat_');

-- AlterTable
ALTER TABLE "erg" ALTER COLUMN "id" SET DEFAULT generate_id('erg_');

-- AlterTable
ALTER TABLE "membership" ALTER COLUMN "id" SET DEFAULT generate_id('mem_');

-- AlterTable
ALTER TABLE "program" ALTER COLUMN "id" SET DEFAULT generate_id('prog_');

-- AlterTable
ALTER TABLE "workout" ALTER COLUMN "id" SET DEFAULT generate_id('work_');

-- AlterTable
ALTER TABLE "workout_fragment" ALTER COLUMN "id" SET DEFAULT generate_id('work_frag_');
