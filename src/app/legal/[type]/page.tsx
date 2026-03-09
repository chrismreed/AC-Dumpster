import { notFound } from 'next/navigation';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { legalDocuments } from '@shared/schema';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

const VALID_TYPES = ['terms', 'privacy', 'contract', 'policy', 'other'] as const;

type LegalType = (typeof VALID_TYPES)[number];

const TYPE_LABELS: Record<LegalType, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  contract: 'Service Contract',
  policy: 'Internal Policy',
  other: 'Legal Document',
};

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as LegalType)) notFound();

  const docs = await db
    .select()
    .from(legalDocuments)
    .where(eq(legalDocuments.type, type))
    .orderBy(desc(legalDocuments.updatedAt));

  const document = docs.find((d) => (d as { isActive?: boolean }).isActive !== false) ?? docs[0];
  if (!document?.content) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to booking
          </Link>
          <article className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {document.title || TYPE_LABELS[type as LegalType]}
            </h1>
            {document.version && (
              <p className="text-sm text-muted-foreground mb-6">Version {document.version}</p>
            )}
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {document.content}
            </div>
          </article>
        </div>
      </div>
      <Footer />
    </div>
  );
}
