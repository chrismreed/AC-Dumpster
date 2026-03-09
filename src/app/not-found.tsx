import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navigation />
            <main className="flex-grow flex items-center justify-center py-20">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                        <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-4xl font-black mb-4">Page Not Found</h2>
                    <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 btn-angled"
                    >
                        <span className="inline-block transform skew-x-12">Return Home</span>
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}
