-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "sections" JSONB;

-- CreateTable
CREATE TABLE "SectionType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'Other',
    "description" TEXT NOT NULL DEFAULT '',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "template" TEXT NOT NULL DEFAULT '',
    "css" TEXT NOT NULL DEFAULT '',
    "sample" JSONB NOT NULL DEFAULT '{}',
    "tocLabel" TEXT NOT NULL DEFAULT '',
    "placement" TEXT NOT NULL DEFAULT 'body',
    "scope" TEXT NOT NULL DEFAULT 'any',
    "builtIn" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "image" TEXT,
    "shops" JSONB NOT NULL DEFAULT '[]',
    "reviewSlug" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SectionType_key_key" ON "SectionType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

