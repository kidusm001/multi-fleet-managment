-- CreateTable
CREATE TABLE "public"."notification_seen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_seen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_seen_userId_idx" ON "public"."notification_seen"("userId");

-- CreateIndex
CREATE INDEX "notification_seen_notificationId_idx" ON "public"."notification_seen"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_seen_userId_notificationId_key" ON "public"."notification_seen"("userId", "notificationId");

-- AddForeignKey
ALTER TABLE "public"."notification_seen" ADD CONSTRAINT "notification_seen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_seen" ADD CONSTRAINT "notification_seen_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
