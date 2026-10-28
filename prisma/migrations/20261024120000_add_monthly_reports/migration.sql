-- CreateEnum
CREATE TYPE "RuleCategory" AS ENUM ('ADULT', 'SUBVERSIVE', 'ANON_PROXY', 'MINING');

-- CreateEnum
CREATE TYPE "RuleMatchType" AS ENUM ('DOMAIN', 'SUFFIX', 'CONTAINS');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "FindingDisposition" AS ENUM ('PENDING', 'CONFIRMED', 'FALSE_POSITIVE', 'ACTION_TAKEN');

-- CreateTable
CREATE TABLE "proxy_account" (
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "position" TEXT,
    "area" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proxy_account_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "imported_log_file" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "linesTotal" INTEGER NOT NULL,
    "linesInvalid" INTEGER NOT NULL,
    "firstEventAt" TIMESTAMP(3) NOT NULL,
    "lastEventAt" TIMESTAMP(3) NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedById" TEXT,

    CONSTRAINT "imported_log_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_user_stat" (
    "date" DATE NOT NULL,
    "proxyAccountId" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "bytesIn" BIGINT NOT NULL,
    "bytesOut" BIGINT NOT NULL,
    "elapsedMs" BIGINT NOT NULL,
    "browsingMs" BIGINT NOT NULL,

    CONSTRAINT "daily_user_stat_pkey" PRIMARY KEY ("date","proxyAccountId")
);

-- CreateTable
CREATE TABLE "daily_site_stat" (
    "date" DATE NOT NULL,
    "site" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "bytesIn" BIGINT NOT NULL,
    "bytesOut" BIGINT NOT NULL,
    "elapsedMs" BIGINT NOT NULL,
    "browsingMs" BIGINT NOT NULL,

    CONSTRAINT "daily_site_stat_pkey" PRIMARY KEY ("date","site")
);

-- CreateTable
CREATE TABLE "daily_site_user_stat" (
    "date" DATE NOT NULL,
    "site" TEXT NOT NULL,
    "proxyAccountId" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "bytesIn" BIGINT NOT NULL,
    "elapsedMs" BIGINT NOT NULL,
    "browsingMs" BIGINT NOT NULL,

    CONSTRAINT "daily_site_user_stat_pkey" PRIMARY KEY ("date","site","proxyAccountId")
);

-- CreateTable
CREATE TABLE "category_rule" (
    "id" TEXT NOT NULL,
    "category" "RuleCategory" NOT NULL,
    "matchType" "RuleMatchType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_report" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "rulesetVersion" INTEGER NOT NULL,
    "coverageDaysExpected" INTEGER NOT NULL,
    "coverageDaysImported" INTEGER NOT NULL,
    "totalHits" BIGINT NOT NULL,
    "unidentifiedHits" BIGINT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "motto" TEXT,
    "place" TEXT,
    "issuedOn" TIMESTAMP(3),
    "docxSha256" TEXT,
    "pdfSha256" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_finding" (
    "id" TEXT NOT NULL,
    "monthlyReportId" TEXT NOT NULL,
    "categoryRuleId" TEXT NOT NULL,
    "proxyAccountId" TEXT,
    "url" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "disposition" "FindingDisposition" NOT NULL DEFAULT 'PENDING',
    "measure" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imported_log_file_sha256_key" ON "imported_log_file"("sha256");

-- CreateIndex
CREATE INDEX "imported_log_file_firstEventAt_lastEventAt_idx" ON "imported_log_file"("firstEventAt", "lastEventAt");

-- CreateIndex
CREATE INDEX "daily_site_user_stat_date_hits_idx" ON "daily_site_user_stat"("date", "hits");

-- CreateIndex
CREATE UNIQUE INDEX "category_rule_category_matchType_pattern_key" ON "category_rule"("category", "matchType", "pattern");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_report_year_month_key" ON "monthly_report"("year", "month");

-- CreateIndex
CREATE INDEX "report_finding_monthlyReportId_idx" ON "report_finding"("monthlyReportId");

-- AddForeignKey
ALTER TABLE "imported_log_file" ADD CONSTRAINT "imported_log_file_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_user_stat" ADD CONSTRAINT "daily_user_stat_proxyAccountId_fkey" FOREIGN KEY ("proxyAccountId") REFERENCES "proxy_account"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_site_user_stat" ADD CONSTRAINT "daily_site_user_stat_proxyAccountId_fkey" FOREIGN KEY ("proxyAccountId") REFERENCES "proxy_account"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_finding" ADD CONSTRAINT "report_finding_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "monthly_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_finding" ADD CONSTRAINT "report_finding_categoryRuleId_fkey" FOREIGN KEY ("categoryRuleId") REFERENCES "category_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_finding" ADD CONSTRAINT "report_finding_proxyAccountId_fkey" FOREIGN KEY ("proxyAccountId") REFERENCES "proxy_account"("username") ON DELETE SET NULL ON UPDATE CASCADE;

