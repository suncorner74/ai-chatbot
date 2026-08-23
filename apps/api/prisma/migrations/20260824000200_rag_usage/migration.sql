CREATE TABLE "RagUsage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "retrievalCount" INTEGER NOT NULL DEFAULT 0,
  "retrievedChunkCount" INTEGER NOT NULL DEFAULT 0,
  "retrievalLatencyMs" INTEGER NOT NULL DEFAULT 0,
  "rerankingLatencyMs" INTEGER NOT NULL DEFAULT 0,
  "llmLatencyMs" INTEGER NOT NULL DEFAULT 0,
  "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "grounded" BOOLEAN NOT NULL DEFAULT false,
  "citationCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "RagUsage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RagUsage_userId_createdAt_idx" ON "RagUsage"("userId", "createdAt");
ALTER TABLE "RagUsage" ADD CONSTRAINT "RagUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
