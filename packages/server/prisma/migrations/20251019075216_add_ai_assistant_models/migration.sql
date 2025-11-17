-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateTable
CREATE TABLE "public"."ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "userRole" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "public"."MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "cost" DECIMAL(10,6),
    "contextUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "endpoint" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "cost" DECIMAL(10,6) NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_conversations_userId_idx" ON "public"."ai_conversations"("userId");

-- CreateIndex
CREATE INDEX "ai_conversations_organizationId_idx" ON "public"."ai_conversations"("organizationId");

-- CreateIndex
CREATE INDEX "ai_conversations_createdAt_idx" ON "public"."ai_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_idx" ON "public"."ai_messages"("conversationId");

-- CreateIndex
CREATE INDEX "ai_messages_createdAt_idx" ON "public"."ai_messages"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_logs_userId_idx" ON "public"."ai_usage_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_organizationId_idx" ON "public"."ai_usage_logs"("organizationId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_createdAt_idx" ON "public"."ai_usage_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_conversations" ADD CONSTRAINT "ai_conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
