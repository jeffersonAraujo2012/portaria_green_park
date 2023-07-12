-- CreateTable
CREATE TABLE "lotes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletos" (
    "id" SERIAL NOT NULL,
    "nome_sacado" VARCHAR(255) NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "linha_digitavel" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
