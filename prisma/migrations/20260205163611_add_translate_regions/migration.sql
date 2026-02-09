-- CreateTable
CREATE TABLE "translate_regions" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "native_name" VARCHAR(255) NOT NULL,
    "flag_url" VARCHAR(512) NOT NULL,
    "default_locale" VARCHAR(16) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translate_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translate_region_locales" (
    "region_id" VARCHAR(32) NOT NULL,
    "locale_code" VARCHAR(16) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "translate_region_locales_pkey" PRIMARY KEY ("region_id","locale_code")
);

-- AddForeignKey
ALTER TABLE "translate_region_locales" ADD CONSTRAINT "translate_region_locales_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "translate_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Optional: index for active regions used in translate UI
CREATE INDEX "idx_translate_regions_active" ON "translate_regions"("is_active") WHERE "is_active" = true;
