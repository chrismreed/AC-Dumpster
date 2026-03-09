import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ServiceAreaMap } from '@/components/ServiceAreaMap';
import { Truck, Clock, DollarSign, Phone, CheckCircle, Trash2, Home as HomeIcon, Star, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Gradient / Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 z-0" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-dark dark:text-primary mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-bold text-sm uppercase tracking-wider">#1 Dumpster Rental in Effingham</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-10 duration-1000">
                Got <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 italic">Junk?&nbsp;</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1200 delay-200">
                Fast delivery, transparent pricing, and driveway-safe equipment. The premium choice for your cleanup projects.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                <Link
                  href="/booking"
                  className="w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground font-bold text-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group btn-angled"
                >
                  <span className="flex items-center gap-2">
                    Book Online
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <a
                  href="tel:217-994-2582"
                  className="w-full sm:w-auto px-10 py-5 bg-background dark:bg-slate-800 border-2 border-border text-foreground font-bold text-xl flex items-center justify-center gap-3 btn-angled"
                >
                  <span className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>217-994-2582</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features / Why Us */}
        <section className="py-24 bg-white dark:bg-slate-950/50 backdrop-blur-sm relative z-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group p-8 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-colors btn-angled">
                  <ShieldCheck className="h-8 w-8 text-primary group-hover:text-black transition-colors transform skew-x-12" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3">Driveway Safe</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Our dumpsters are designed with unique rubber wheels and protective boards to ensure your property remains damage-free.
                </p>
              </div>

              <div className="group p-8 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-colors btn-angled">
                  <Zap className="h-8 w-8 text-primary group-hover:text-black transition-colors transform skew-x-12" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3">Lightning Fast</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Same-day delivery available. We value your time and stick to our schedule so you can stick to yours.
                </p>
              </div>

              <div className="group p-8 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-colors btn-angled">
                  <DollarSign className="h-8 w-8 text-primary group-hover:text-black transition-colors transform skew-x-12" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3">Crystal Clear Pricing</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Flat-rate pricing with no hidden fees. Weight, delivery, pickup, and rental period—all included in one upfront price.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dumpster Sizes */}
        <section className="py-24 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-primary font-bold tracking-widest uppercase mb-2 block">Choose Your Equipment</span>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                Perfect Sizes for Every Project
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* 15 Yard */}
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-border transition-all hover:shadow-2xl group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trash2 className="h-48 w-48 text-primary" />
                </div>
                <div className="p-10 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-black text-foreground mb-1">15 Yard</h3>
                      <p className="text-muted-foreground font-medium">Home Cleanouts & Small Renos</p>
                    </div>
                    <div className="bg-primary/10 px-4 py-2 rounded-xl">
                      <span className="text-xl font-black text-primary-dark dark:text-primary">Best Seller</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">Fits ~6 pickup loads</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">Perfect for garage cleanouts</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">Includes 2,000 lbs disposal</span>
                    </div>
                  </div>

                  <div className="flex items-end gap-2 mb-8">
                    <span className="text-4xl font-black text-foreground">$340</span>
                    <span className="text-lg font-medium text-muted-foreground mb-1">24 Hour Rental</span>
                  </div>

                  <Link href="/booking" className="block w-full py-4 text-center rounded-xl bg-foreground text-background font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                    Select 15 Yard
                  </Link>
                </div>
              </div>

              {/* 20 Yard */}
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-950 border border-border transition-all hover:shadow-2xl group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trash2 className="h-48 w-48 text-primary" />
                </div>
                <div className="p-10 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-black text-foreground mb-1">20 Yard</h3>
                      <p className="text-muted-foreground font-medium">Large Renos & Construction</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">Fits ~8 pickup loads</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">Ideal for kitchen remodels</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">Includes 2,000 lbs disposal</span>
                    </div>
                  </div>

                  <div className="flex items-end gap-2 mb-8">
                    <span className="text-4xl font-black text-foreground">$375</span>
                    <span className="text-lg font-medium text-muted-foreground mb-1">24 Hour Rental</span>
                  </div>

                  <Link href="/booking" className="block w-full py-4 text-center rounded-xl bg-foreground text-background font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                    Select 20 Yard
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/pricing" className="inline-flex items-center gap-2 font-bold text-muted-foreground hover:text-primary transition-colors">
                View Full Pricing & Durations <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to clear the clutter?</h2>
            <p className="text-xl md:text-2xl font-medium opacity-90 mb-10 max-w-2xl mx-auto">
              Book your dumpster in under 60 seconds. No phone tag, no waiting.
            </p>
            <Link
              href="/booking"
              className="inline-block px-12 py-6 bg-white dark:bg-slate-900 text-black dark:text-white font-bold text-xl btn-angled"
            >
              <span className="inline-block">Start Booking</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
