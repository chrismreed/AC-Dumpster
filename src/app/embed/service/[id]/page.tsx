'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DynamicFormRenderer } from '@/components/admin/form-builder/dynamic-form-renderer';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice?: number | null;
  priceUnit?: string | null;
  formSchema?: any;
}

export default function EmbedServicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = params.id as string;

  // Customization options from URL params
  const primaryColor = searchParams.get('primaryColor') || '#f7c948';
  const showHeader = searchParams.get('showHeader') !== 'false';
  const customLogo = searchParams.get('logo');

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

  // Send height updates to parent iframe
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage(
        {
          type: 'alleycat-resize',
          height: height,
        },
        '*'
      );
    };

    // Send initial height
    sendHeight();

    // Send height on resize
    const resizeObserver = new ResizeObserver(sendHeight);
    resizeObserver.observe(document.body);

    // Send height periodically (for dynamic content)
    const interval = setInterval(sendHeight, 500);

    return () => {
      resizeObserver.disconnect();
      clearInterval(interval);
    };
  }, [service]);

  const handleSubmit = async (formData: Record<string, any>, calculatedPrice: number) => {
    try {
      const response = await fetch('/api/service-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: parseInt(serviceId),
          formData,
          calculatedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const result = await response.json();

      // Notify parent of success with submission ID
      window.parent.postMessage(
        {
          type: 'alleycat-success',
          serviceId: serviceId,
          submissionId: result.id,
        },
        '*'
      );

      // Redirect to confirmation page (will work if embedded in same domain, otherwise parent handles it)
      window.top?.location.assign(`/confirmation?id=${result.id}&type=service`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-600">Loading service...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12 min-h-screen bg-gray-50">
        <p className="text-gray-600">Service not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Optional Header */}
        {showHeader && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {customLogo && (
              <div className="mb-4">
                <img src={customLogo} alt="Logo" className="h-12 object-contain" />
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {service.name}
            </h1>
            <p className="text-gray-600 whitespace-pre-wrap">
              {service.description}
            </p>
            {service.basePrice && (
              <div
                className="mt-4 p-4 rounded-lg inline-block"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <p className="text-sm text-gray-600">Starting at</p>
                <p className="text-xl font-bold text-gray-900">
                  ${service.basePrice.toFixed(2)}
                  {service.priceUnit && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      {service.priceUnit}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Service Form */}
        {service.formSchema && service.formSchema.fields && service.formSchema.fields.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            {!showHeader && (
              <h2 className="text-xl font-bold text-gray-900 mb-6">{service.name}</h2>
            )}
            <DynamicFormRenderer
              schema={service.formSchema}
              basePrice={service.basePrice || 0}
              onSubmit={handleSubmit}
              isPreview={false}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-6">
              This service doesn't have a custom form yet. Please contact us directly for more information.
            </p>
          </div>
        )}
      </div>

      {/* Branding footer */}
      <div className="text-center mt-6 text-xs text-gray-500">
        Powered by Alley Cat Dumpsters
      </div>
    </div>
  );
}
