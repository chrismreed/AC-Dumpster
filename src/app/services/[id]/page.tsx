'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { DynamicFormRenderer } from '@/components/admin/form-builder/dynamic-form-renderer';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  basePrice?: number | null;
  priceUnit?: string | null;
  formSchema?: any;
}

export default function ServiceRequestPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ['public-service', serviceId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/services/${serviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch service');
      }
      return response.json();
    },
  });

  const handleSubmit = async (formData: Record<string, any>, calculatedPrice: number) => {
    console.log('Form submission started', { formData, calculatedPrice, serviceId });

    try {
      // Save the service response
      const response = await fetch('/api/service-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: parseInt(serviceId),
          formData,
          calculatedPrice,
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API error:', errorData);
        throw new Error(errorData.message || 'Failed to submit form');
      }

      const result = await response.json();
      console.log('Submission result:', result);

      // Redirect to confirmation page with submission ID
      if (result.id) {
        console.log('Redirecting to confirmation:', result.id);
        router.push(`/confirmation?id=${result.id}&type=service`);
      } else {
        console.error('No ID in result:', result);
        throw new Error('No submission ID returned');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/services">
            <Button variant="ghost" className="mb-6 text-foreground/70 hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
          </Link>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading service...</span>
            </div>
          ) : service ? (
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-card rounded-lg shadow-md p-8 mb-6 border border-border">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {service.name}
                </h1>
                <p className="text-lg text-muted-foreground whitespace-pre-wrap">
                  {service.description}
                </p>
                {service.basePrice && (
                  <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg inline-block border border-yellow-500/20">
                    <p className="text-sm text-muted-foreground">Starting at</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${service.basePrice.toFixed(2)}
                      {service.priceUnit && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          {service.priceUnit}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Service Form */}
              {service.formSchema && service.formSchema.fields && service.formSchema.fields.length > 0 ? (
                <DynamicFormRenderer
                  schema={service.formSchema}
                  basePrice={service.basePrice || 0}
                  onSubmit={handleSubmit}
                  isPreview={false}
                />
              ) : (
                <div className="bg-card rounded-lg shadow-md p-8 text-center border border-border">
                  <p className="text-muted-foreground mb-6">
                    This service doesn't have a custom form yet. Please contact us directly for more information.
                  </p>
                  <Link href="/contact">
                    <Button className="bg-[#f7c948] hover:bg-[#f7c948]/90 text-black">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Service not found.</p>
              <Link href="/services">
                <Button className="mt-4">View All Services</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
