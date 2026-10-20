-- Alineación de drift: la extensión prisma_postgres la provee el entorno de
-- hosting de Prisma (Prisma Postgres). En PostgreSQL self-hosted la extensión
-- no está instalada en el servidor, por lo que un CREATE EXTENSION directo
-- aborta la migración con: ERROR: extension "prisma_postgres" is not available.
--
-- Se crea solo si el control file está disponible; en caso contrario se omite
-- de forma explícita. La app no depende de esta extensión: el schema solo
-- requiere citext (ya incluida en las extensiones de la datasource).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'prisma_postgres')
       OR EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'prisma_postgres')
    THEN
        CREATE EXTENSION IF NOT EXISTS "prisma_postgres";
    ELSE
        RAISE NOTICE 'La extension prisma_postgres no esta disponible en este servidor (PostgreSQL self-hosted); se omite.';
    END IF;
END
$$;
