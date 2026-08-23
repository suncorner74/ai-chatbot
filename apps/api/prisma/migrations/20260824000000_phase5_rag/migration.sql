CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');

CREATE TABLE "KnowledgeBase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KnowledgeBase_userId_name_key" ON "KnowledgeBase"("userId", "name");
CREATE INDEX "KnowledgeBase_userId_idx" ON "KnowledgeBase"("userId");

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT,
  "name" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "fileHash" TEXT NOT NULL,
  "documentVersion" INTEGER NOT NULL DEFAULT 1,
  "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADING',
  "processingError" TEXT,
  "sourceContent" TEXT,
  "metadata" TEXT,
  "chunkCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_contentHash_idx" ON "Document"("contentHash");
CREATE INDEX "Document_fileHash_idx" ON "Document"("fileHash");
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

CREATE TABLE "DocumentVersion" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "fileHash" TEXT NOT NULL,
  "embeddingVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");
CREATE INDEX "DocumentVersion_contentHash_idx" ON "DocumentVersion"("contentHash");

CREATE TABLE "DocumentChunk" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "parentId" TEXT,
  "chunkIndex" INTEGER NOT NULL,
  "page" INTEGER,
  "section" TEXT,
  "heading" TEXT,
  "content" TEXT NOT NULL,
  "context" TEXT,
  "contentHash" TEXT NOT NULL,
  "embedding" TEXT,
  "embeddingVersion" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "DocumentChunk"("documentId", "chunkIndex");
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");
CREATE INDEX "DocumentChunk_parentId_idx" ON "DocumentChunk"("parentId");
CREATE INDEX "DocumentChunk_contentHash_idx" ON "DocumentChunk"("contentHash");

CREATE TABLE "KnowledgeBaseDocument" (
  "knowledgeBaseId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("knowledgeBaseId", "documentId")
);
CREATE INDEX "KnowledgeBaseDocument_documentId_idx" ON "KnowledgeBaseDocument"("documentId");

ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeBaseDocument" ADD CONSTRAINT "KnowledgeBaseDocument_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "KnowledgeBase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeBaseDocument" ADD CONSTRAINT "KnowledgeBaseDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
