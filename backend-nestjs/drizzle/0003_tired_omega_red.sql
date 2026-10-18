CREATE TABLE "user_images" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"imported_key" text,
	"key" text GENERATED ALWAYS AS (COALESCE("imported_key", 'user-image/' || "user_id" || '/' || "id"::text)) STORED NOT NULL,
	"content_type" text,
	"size" integer,
	"status" "image_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_images_ready_metadata" CHECK ("user_images"."status" <> 'ready' OR ("user_images"."content_type" IS NOT NULL AND "user_images"."size" IS NOT NULL)),
	CONSTRAINT "user_images_size_positive" CHECK ("user_images"."size" > 0)
);
--> statement-breakpoint
ALTER TABLE "user_images" ADD CONSTRAINT "user_images_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
-- Transfere fotos vinculadas sem mover ou excluir objetos no S3.
-- Referências compartilhadas recebem registros distintos por proprietário.
WITH linked AS (
  SELECT i.*, u.id AS owner_id,
    row_number() OVER (PARTITION BY i.id ORDER BY u.id) AS reference_number
  FROM images i
  JOIN "user" u ON (
    u.image = i.key OR
    u.image ~ ('/user-images/' || i.id::text || '([?#].*)?$') OR
    u.image LIKE '%/' || i.key OR
    u.image LIKE '%/' || i.key || '?%'
  )
  WHERE i.key_prefix = 'user-image'
), migrated AS (
  INSERT INTO user_images (id, user_id, imported_key, content_type, size, status, created_at)
  SELECT CASE WHEN reference_number = 1 THEN id ELSE uuidv7() END,
    owner_id, key, content_type, size, status, created_at
  FROM linked
  RETURNING id, user_id
)
UPDATE "user" u
SET image = CASE
  WHEN u.image ~ '/user-images/[^/?#]+'
    THEN regexp_replace(u.image, '/user-images/[^/?#]+', '/user-images/' || m.id::text)
  ELSE '/user-images/' || m.id::text
END
FROM migrated m
WHERE u.id = m.user_id;
--> statement-breakpoint
-- Os metadados vinculados já estão na tabela pessoal; objetos não são excluídos.
DELETE FROM images i
WHERE i.key_prefix = 'user-image'
  AND EXISTS (SELECT 1 FROM user_images p WHERE p.imported_key = i.key);
