ALTER TABLE "car_image" RENAME TO "image";
ALTER TABLE "image" RENAME CONSTRAINT "car_image_pkey" TO "image_pkey";
ALTER TABLE "image" ADD COLUMN "tag" VARCHAR(100);
UPDATE "image" SET "tag" = 'car-image';
ALTER TABLE "image" ALTER COLUMN "tag" SET NOT NULL;
CREATE INDEX "image_tag_idx" ON "image"("tag");
