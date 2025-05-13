import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Award, ThumbsUp, ArrowRight } from 'lucide-react';

export function ImprovedHero() {
  return (
    <section className="relative bg-gray-900 pt-32 pb-20 md:pb-32 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/20 opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
              <span className="text-sm font-semibold">Professional Service • Available Now</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Expert Dumpster Rental <span className="text-primary">Made Simple</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-6 md:pr-12">
              Get the right size dumpster delivered on time, every time. Transparent pricing with no hidden fees.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" className="font-semibold">
                <a href="#booking-form" className="flex items-center">
                  Book Your Dumpster <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              
              <Button variant="outline" size="lg" className="font-semibold text-white border-white hover:text-primary hover:bg-white">
                <a href="#services">View Sizes & Pricing</a>
              </Button>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">100+</p>
                <p className="text-sm text-gray-300">Happy Customers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">24h</p>
                <p className="text-sm text-gray-300">Fast Delivery</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">5★</p>
                <p className="text-sm text-gray-300">Customer Rating</p>
              </div>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1620588280212-bf7b4beb3214?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80" 
                alt="Dumpster rental" 
                className="w-full h-auto rounded-lg object-cover shadow-lg"
              />
              <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg">
                <h3 className="text-white font-bold text-xl mb-2">Why Customers Choose Us</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <ThumbsUp className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-gray-300">Easy online booking process</span>
                  </li>
                  <li className="flex items-start">
                    <ThumbsUp className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-gray-300">Flexible rental periods</span>
                  </li>
                  <li className="flex items-start">
                    <ThumbsUp className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-gray-300">Transparent pricing, no hidden fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust bar */}
      <div className="container mx-auto px-4 mt-16">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-center text-white text-sm font-medium mb-6">TRUSTED BY HOMEOWNERS & CONTRACTORS ACROSS EFFINGHAM</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="flex flex-col items-center">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <span className="text-gray-300 text-xs md:text-sm text-center">Fully Insured & Licensed</span>
            </div>
            <div className="flex flex-col items-center">
              <Award className="h-10 w-10 text-primary mb-2" />
              <span className="text-gray-300 text-xs md:text-sm text-center">Top-Rated Local Business</span>
            </div>
            <div className="flex flex-col items-center">
              <ThumbsUp className="h-10 w-10 text-primary mb-2" />
              <span className="text-gray-300 text-xs md:text-sm text-center">98% Customer Satisfaction</span>
            </div>
            <div className="flex flex-col items-center">
              <svg className="h-10 w-10 text-primary mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span className="text-gray-300 text-xs md:text-sm text-center">7+ Years Experience</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}