CREATE TABLE "companions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"class" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"element" text DEFAULT 'none' NOT NULL,
	"rarity" text DEFAULT 'C' NOT NULL,
	"stats" jsonb NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"battles_fought" integer DEFAULT 0 NOT NULL,
	"recruited_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friendships" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "companions" ADD CONSTRAINT "companions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_accounts_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;