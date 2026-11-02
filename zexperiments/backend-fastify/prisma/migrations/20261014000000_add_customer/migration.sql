-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'COMPANY');

-- CreateTable
CREATE TABLE "customer" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cpf_cnpj" VARCHAR(14) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "type" "CustomerType" NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_created_by_idx" ON "customer"("created_by");

-- CreateIndex
CREATE INDEX "customer_updated_by_idx" ON "customer"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "customer_organization_id_cpf_cnpj_key" ON "customer"("organization_id", "cpf_cnpj");

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
