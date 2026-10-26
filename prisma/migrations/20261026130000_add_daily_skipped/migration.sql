-- CreateTable
CREATE TABLE "daily_skipped" (
    "date" DATE NOT NULL,
    "unserved" INTEGER NOT NULL DEFAULT 0,
    "internal" INTEGER NOT NULL DEFAULT 0,
    "telemetry" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_skipped_pkey" PRIMARY KEY ("date")
);
