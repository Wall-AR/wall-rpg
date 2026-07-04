ALTER TABLE "accounts" ADD COLUMN "role" text DEFAULT 'player' NOT NULL;--> statement-breakpoint
ALTER TABLE "retired_characters" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;