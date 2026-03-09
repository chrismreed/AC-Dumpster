'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ServiceFormBuilder, { FormSchema } from '@/components/admin/service-form-builder';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  isActive: boolean;
  formSchema: FormSchema | null;
}

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const serviceId = params.id as string;

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/services/${serviceId}`);
      if (!res.ok) throw new Error('Failed to fetch service');
      return res.json();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (schema: FormSchema) => {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formSchema: schema }),
      });
      if (!res.ok) throw new Error('Failed to update form schema');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      toast({
        title: 'Form saved',
        description: 'The service form has been updated successfully.',
      });
      router.push('/admin/services');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save the form. Please try again.',
        variant: 'destructive',
      });
    }
  });

  if (isLoading) {
    return (
      <div className="p-10 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-10 max-w-[1600px] mx-auto">
        <Card className="border-none shadow-xl rounded-3xl">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 font-bold">Service not found</p>
            <Button
              onClick={() => router.push('/admin/services')}
              className="mt-4 rounded-2xl"
            >
              Back to Services
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/services')}
          className="mb-4 rounded-2xl"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
        <h1 className="text-2xl font-black text-gray-900">Form Builder</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure the form for: <span className="font-bold">{service.name}</span>
        </p>
      </div>

      <Card className="border-none shadow-2xl rounded-3xl mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-black">Service Information</CardTitle>
          <CardDescription className="font-medium">
            Base Price: ${(service.basePrice / 100).toFixed(2)} per {service.priceUnit}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{service.description}</p>
        </CardContent>
      </Card>

      <ServiceFormBuilder
        initialSchema={service.formSchema || undefined}
        onSave={(schema) => updateMutation.mutate(schema)}
        onCancel={() => router.push('/admin/services')}
      />
    </div>
  );
}
