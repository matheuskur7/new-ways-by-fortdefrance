-- AlterTable
ALTER TABLE "auth_user" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "organization_member" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "organization_invitation" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "image" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "CardFeeGroup" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "CardFee" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_by" TEXT;

-- CreateIndex
CREATE INDEX "auth_user_created_by_idx" ON "auth_user"("created_by");

-- CreateIndex
CREATE INDEX "auth_user_updated_by_idx" ON "auth_user"("updated_by");

-- CreateIndex
CREATE INDEX "organization_created_by_idx" ON "organization"("created_by");

-- CreateIndex
CREATE INDEX "organization_updated_by_idx" ON "organization"("updated_by");

-- CreateIndex
CREATE INDEX "organization_member_created_by_idx" ON "organization_member"("created_by");

-- CreateIndex
CREATE INDEX "organization_member_updated_by_idx" ON "organization_member"("updated_by");

-- CreateIndex
CREATE INDEX "organization_invitation_created_by_idx" ON "organization_invitation"("created_by");

-- CreateIndex
CREATE INDEX "organization_invitation_updated_by_idx" ON "organization_invitation"("updated_by");

-- CreateIndex
CREATE INDEX "image_created_by_idx" ON "image"("created_by");

-- CreateIndex
CREATE INDEX "image_updated_by_idx" ON "image"("updated_by");

-- CreateIndex
CREATE INDEX "CardFeeGroup_created_by_idx" ON "CardFeeGroup"("created_by");

-- CreateIndex
CREATE INDEX "CardFeeGroup_updated_by_idx" ON "CardFeeGroup"("updated_by");

-- CreateIndex
CREATE INDEX "CardFee_created_by_idx" ON "CardFee"("created_by");

-- CreateIndex
CREATE INDEX "CardFee_updated_by_idx" ON "CardFee"("updated_by");

-- AddForeignKey
ALTER TABLE "auth_user" ADD CONSTRAINT "auth_user_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_user" ADD CONSTRAINT "auth_user_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardFeeGroup" ADD CONSTRAINT "CardFeeGroup_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardFeeGroup" ADD CONSTRAINT "CardFeeGroup_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardFee" ADD CONSTRAINT "CardFee_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardFee" ADD CONSTRAINT "CardFee_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
