ALTER TABLE "images" ALTER COLUMN "id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "key_prefix" text NOT NULL;--> statement-breakpoint
ALTER TABLE "images" drop column "key";--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "key" text GENERATED ALWAYS AS ('images/' || "organization_id" || '/' || "key_prefix" || '/' || "id"::text) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_key_unique" UNIQUE("key");--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "content_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "filename";--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "checksum";--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_ready_metadata" CHECK ("images"."status" <> 'ready' OR ("images"."content_type" IS NOT NULL AND "images"."size" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_size_positive" CHECK ("images"."size" > 0);