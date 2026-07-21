-- ============================================================
--  Sincronización de esquema: LOCAL (riwi_local)  ->  SUPABASE
--  Fecha: 2026-07 · Idempotente (seguro de re-ejecutar).
--  Cómo aplicar: pegar y ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1) campaigns.type debe ser NULLABLE.
--    (Bug original: en Supabase estaba NOT NULL y rompía la creación de
--    campañas cuando el formulario no envía "type").
ALTER TABLE public.campaigns ALTER COLUMN type DROP NOT NULL;

-- 2) institutions: columnas para el logo y el banner del colegio.
--    Guardamos URLs (VARCHAR), no imágenes (BLOB), para no inflar la BD.
ALTER TABLE public.institutions
    ADD COLUMN IF NOT EXISTS logo_url   VARCHAR(500),
    ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);

-- 3) (DATOS, opcional) Asignar los logos/banners de los colegios.
--    Ejecutar además:  backend/seed/institution_images.sql
--    (usa las mismas URLs del bucket de Supabase Storage y hace match por
--    nombre de institución con ILIKE, así que funciona igual en Supabase).

-- 4) updates: constraint UNIQUE que habilita el upsert de "actualización de
--    datos" (INSERT ... ON CONFLICT ON CONSTRAINT uq_updates_people_campaign).
--    (Bug: en Supabase no existía y el PUT /update-my-data daba 500 · 42704).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_updates_people_campaign') THEN
        ALTER TABLE public.updates
            ADD CONSTRAINT uq_updates_people_campaign UNIQUE (people_id, campaign_id);
    END IF;
END $$;

-- 5) Zona horaria: updates.updated_at y campaign_enrollments.enrolled_at deben
--    ser timestamptz (instante absoluto). Antes eran "without time zone", lo que
--    corría las fechas de actualización según la zona del servidor Node.
--    Los valores existentes se interpretan como UTC (así los guardaba NOW() en
--    Supabase). Solo convierte si aún es "without time zone" (idempotente).
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='updates' AND column_name='updated_at')
       = 'timestamp without time zone' THEN
        ALTER TABLE public.updates
            ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
    END IF;

    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='campaign_enrollments' AND column_name='enrolled_at')
       = 'timestamp without time zone' THEN
        ALTER TABLE public.campaign_enrollments
            ALTER COLUMN enrolled_at TYPE timestamptz USING enrolled_at AT TIME ZONE 'UTC';
    END IF;
END $$;
