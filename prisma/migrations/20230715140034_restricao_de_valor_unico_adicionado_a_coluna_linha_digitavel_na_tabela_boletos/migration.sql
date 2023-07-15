/*
  Warnings:

  - A unique constraint covering the columns `[linha_digitavel]` on the table `boletos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "boletos_linha_digitavel_key" ON "boletos"("linha_digitavel");
