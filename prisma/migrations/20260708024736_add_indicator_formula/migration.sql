-- CreateTable
CREATE TABLE "IndicatorFormula" (
    "id" SERIAL NOT NULL,
    "indicatorId" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorFormula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorFormula_indicatorId_key" ON "IndicatorFormula"("indicatorId");

-- AddForeignKey
ALTER TABLE "IndicatorFormula" ADD CONSTRAINT "IndicatorFormula_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
