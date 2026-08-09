-- Alineación de drift: la extensión prisma_postgres ya está instalada en la base de datos
-- (provista por el entorno de hosting de Prisma). Idempotente si ya existe.
CREATE EXTENSION IF NOT EXISTS "prisma_postgres";