-- CreateEnum
CREATE TYPE "ChannelKind" AS ENUM ('everyone', 'group', 'direct_message');

-- CreateTable
CREATE TABLE "channel" (
    "id" TEXT NOT NULL DEFAULT generate_id('chan_'::text),
    "kind" "ChannelKind" NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_member" (
    "id" TEXT NOT NULL DEFAULT generate_id('chm_'::text),
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedByUserId" TEXT,
    "visibleFrom" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_read" (
    "id" TEXT NOT NULL DEFAULT generate_id('chr_'::text),
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_read_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL DEFAULT generate_id('msg_'::text),
    "channelId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "parentId" TEXT,
    "text" TEXT,
    "gif" TEXT,
    "quotedMessageId" TEXT,
    "forwardedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reaction" (
    "id" TEXT NOT NULL DEFAULT generate_id('rxn_'::text),
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_groupId_key" ON "channel"("groupId");

-- CreateIndex
CREATE INDEX "channel_member_userId_idx" ON "channel_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_member_channelId_userId_key" ON "channel_member"("channelId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_read_channelId_userId_key" ON "channel_read"("channelId", "userId");

-- CreateIndex
CREATE INDEX "message_channelId_parentId_createdAt_idx" ON "message"("channelId", "parentId", "createdAt");

-- CreateIndex
CREATE INDEX "message_parentId_createdAt_idx" ON "message"("parentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_reaction_messageId_userId_emoji_key" ON "message_reaction"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "channel_member" ADD CONSTRAINT "channel_member_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_read" ADD CONSTRAINT "channel_read_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_quotedMessageId_fkey" FOREIGN KEY ("quotedMessageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_forwardedFromId_fkey" FOREIGN KEY ("forwardedFromId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
