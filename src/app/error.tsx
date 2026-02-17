'use client';

import { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navigation />
            <main className="flex-grow flex items-center justify-center py-20">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
                        <AlertTriangle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h2 className="text-4xl font-black mb-4">Something went wrong!</h2>
                    <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
                        We encountered an unexpected error. Please try again or contact support if the issue persists.
                    </p>
                    <button
                        onClick={reset}
                        className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 btn-angled"
                    >
                        <span className="inline-block transform skew-x-12">Try again</span>
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
