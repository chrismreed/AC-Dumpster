'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Phone, Calendar, DollarSign, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ConfirmationData {
  id: number;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  calculatedPrice: number;
  responses: Record<string, any>;
  createdAt: string;
  hasPayment: boolean;
  paymentStatus?: string;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const submissionId = searchParams.get('id');
  const type = searchParams.get('type') || 'service'; // 'service' or 'booking'

  useEffect(() => {
    if (!submissionId) {
      setError('No submission ID provided');
      setLoading(false);
      return;
    }

    // Fetch confirmation data
    const fetchConfirmation = async () => {
      try {
        const response = await fetch(`/api/confirmation/${submissionId}?type=${type}`);
        if (!response.ok) {
          throw new Error('Failed to load confirmation details');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching confirmation:', err);
        setError('Unable to load confirmation details');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmation();
  }, [submissionId, type]);

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading confirmation...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <div className="text-red-500 mb-4">
                <FileText className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {error || 'Confirmation Not Found'}
              </h2>
              <p className="text-gray-600 mb-6">
                We couldn't find your confirmation details. Please contact us if you need assistance.
              </p>
              <Link href="/services">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  Back to Services
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              {data.hasPayment && data.paymentStatus === 'paid'
                ? 'Payment Successful!'
                : 'Request Submitted Successfully!'}
            </h1>
            <p className="text-lg text-gray-600">
              {data.hasPayment && data.paymentStatus === 'paid'
                ? 'Your payment has been processed and your service request is confirmed.'
                : 'Thank you! We\'ve received your service request and will contact you shortly.'}
            </p>
          </div>

          {/* Confirmation Details */}
          <div className="space-y-6">
            {/* Reference Number */}
            <Card className="border-2 border-yellow-500 bg-yellow-50">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Confirmation Number</p>
                  <p className="text-3xl font-black text-gray-900">#{data.id.toString().padStart(6, '0')}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please reference this number in any correspondence
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service & Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-black">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Service</p>
                  <p className="text-lg font-bold text-gray-900">{data.serviceName}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase mb-1">Contact Name</p>
                    <p className="text-gray-900">{data.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase mb-1">Date Submitted</p>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(data.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase mb-1">Email</p>
                    <div className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-2" />
                      {data.customerEmail}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase mb-1">Phone</p>
                    <div className="flex items-center text-gray-900">
                      <Phone className="h-4 w-4 mr-2" />
                      {data.customerPhone}
                    </div>
                  </div>
                </div>

                {data.calculatedPrice > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-bold text-gray-500 uppercase mb-1">
                      {data.hasPayment && data.paymentStatus === 'paid' ? 'Amount Paid' : 'Estimated Price'}
                    </p>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                      <span className="text-2xl font-black text-gray-900">
                        ${(data.calculatedPrice / 100).toFixed(2)}
                      </span>
                      {data.hasPayment && data.paymentStatus === 'paid' && (
                        <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">
                          PAID
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-black">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  <li className="flex">
                    <span className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center mr-3">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">Confirmation Email</p>
                      <p className="text-sm text-gray-600">
                        You'll receive a confirmation email at {data.customerEmail} within the next few minutes.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center mr-3">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">Team Review</p>
                      <p className="text-sm text-gray-600">
                        Our team will review your request and verify all details.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center mr-3">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">We'll Contact You</p>
                      <p className="text-sm text-gray-600">
                        {data.hasPayment && data.paymentStatus === 'paid'
                          ? 'We\'ll reach out within 1-2 business days to schedule your service.'
                          : 'We\'ll contact you within 1-2 business days to discuss next steps and finalize details.'}
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/services">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl">
                  Browse Other Services
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl">
                  Return to Home
                </Button>
              </Link>
            </div>

            {/* Print Button */}
            <div className="text-center pt-4">
              <Button
                variant="ghost"
                onClick={() => window.print()}
                className="text-gray-600 hover:text-gray-900"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Confirmation
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
