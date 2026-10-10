CREATE TABLE "car_image" (
    "id" UUID NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID,
    "service_order_id" UUID,
    CONSTRAINT "car_image_pkey" PRIMARY KEY ("id")
);
