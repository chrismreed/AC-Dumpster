'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceFormRenderer } from '@/components/service-form-renderer';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  isActive: boolean;
  formSchema: any;
}

export default function RequestServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = parseInt(params.serviceId as string);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [showContactForm, setShowContactForm] = useState(false);

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/services/${serviceId}`);
      if (!res.ok) throw new Error('Failed to fetch service');
      return res.json();
    },
    enabled: !isNaN(serviceId),
  });

  const submitMutation = useMutation({
    mutationFn: async ({ responses, calculatedPrice }: { responses: Record<string, any>; calculatedPrice: number }) => {
      const res = await fetch('/api/service-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          customerName: contactInfo.name,
          customerEmail: contactInfo.email,
          customerPhone: contactInfo.phone,
          responses,
          calculatedPrice,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit request');
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const handleSubmit = async (responses: Record<string, any>, calculatedPrice: number) => {
    if (!showContactForm) {
      setShowContactForm(true);
      return;
    }

    if (!contactInfo.name || !contactInfo.email || !contactInfo.phone) {
      alert('Please fill in all contact information');
      return;
    }

    await submitMutation.mutateAsync({ responses, calculatedPrice });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-12">
          <Card className="border-none shadow-xl rounded-3xl">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 font-bold mb-4">Service not found</p>
              <Button onClick={() => router.push('/services')} className="rounded-2xl">
                Browse Services
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!service.formSchema || !service.formSchema.fields || service.formSchema.fields.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-12">
          <Card className="border-none shadow-xl rounded-3xl">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 font-bold mb-4">
                This service doesn't have a form configured yet
              </p>
              <Button onClick={() => router.push('/contact')} className="rounded-2xl">
                Contact Us
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="border-none shadow-2xl rounded-3xl max-w-2xl">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Request Submitted!</h1>
              <p className="text-gray-600 font-medium">
                Thank you for your request. We'll review it and get back to you within 24 hours with a quote.
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => router.push('/')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl px-8"
              >
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/services')}
          className="mb-6 rounded-2xl"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>

        {showContactForm ? (
          <Card className="border-none shadow-2xl rounded-3xl mb-6">
            <CardContent className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Contact Information</h2>
                <p className="text-sm text-gray-600">
                  We'll use this information to send you a quote
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Full Name *</Label>
                  <Input
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 rounded-xl"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold">Email *</Label>
                  <Input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12 rounded-xl"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold">Phone *</Label>
                  <Input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-12 rounded-xl"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 rounded-2xl font-bold"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    // Trigger form submission
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }}
                  disabled={submitMutation.isPending}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <ServiceFormRenderer
          schema={service.formSchema}
          serviceName={service.name}
          basePrice={service.basePrice}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
        />
      </div>
    </div>
  );
}
