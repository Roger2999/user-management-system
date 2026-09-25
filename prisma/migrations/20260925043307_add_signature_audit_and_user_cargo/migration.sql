-- AlterTable
ALTER TABLE "AccountRequestSignature" ADD COLUMN     "historialCorrecciones" JSONB,
ADD COLUMN     "registradoPorNombre" TEXT,
ADD COLUMN     "registradoPorUserId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "cargo" TEXT;

-- CreateIndex
CREATE INDEX "AccountRequestSignature_registradoPorUserId_idx" ON "AccountRequestSignature"("registradoPorUserId");

-- AddForeignKey
ALTER TABLE "AccountRequestSignature" ADD CONSTRAINT "AccountRequestSignature_registradoPorUserId_fkey" FOREIGN KEY ("registradoPorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
