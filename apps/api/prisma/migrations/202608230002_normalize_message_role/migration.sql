-- Normalize Message.role to TEXT so Prisma matches the production schema.
-- Existing values such as user/assistant/system are preserved.
ALTER TABLE "Message"
  ALTER COLUMN "role" TYPE TEXT
  USING "role"::text;
