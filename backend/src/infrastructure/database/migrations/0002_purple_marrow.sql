ALTER TABLE "nodes" ADD COLUMN "storage_key" text;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "mime_type" varchar(255);--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "is_trashed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "trashed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "original_parent_id" uuid;--> statement-breakpoint
CREATE INDEX "nodes_is_trashed_idx" ON "nodes" USING btree ("is_trashed");--> statement-breakpoint
CREATE INDEX "nodes_parent_trashed_idx" ON "nodes" USING btree ("parent_id","is_trashed");