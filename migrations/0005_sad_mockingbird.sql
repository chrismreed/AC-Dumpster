ALTER TABLE "legal_documents" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD COLUMN "is_required" boolean DEFAULT false;