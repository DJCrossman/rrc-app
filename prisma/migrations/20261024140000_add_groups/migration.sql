-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL DEFAULT generate_id('grp_'::text),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_program" (
    "id" TEXT NOT NULL DEFAULT generate_id('grp_prog_'::text),
    "groupId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "group_program_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_program_groupId_programId_key" ON "group_program"("groupId", "programId");

-- AddForeignKey
ALTER TABLE "group_program" ADD CONSTRAINT "group_program_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_program" ADD CONSTRAINT "group_program_programId_fkey" FOREIGN KEY ("programId") REFERENCES "program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
