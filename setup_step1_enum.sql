-- PASSO 1: Adicionar o cargo 'admin'
-- Execute e aguarde o sucesso.
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
