import { Link } from "wouter";

export function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-primary to-primary-700 text-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Fast, Reliable Dumpster Rental Made Easy</h1>
          <p className="text-xl opacity-90 mb-8">Book your dumpster in minutes with instant pricing and convenient delivery options.</p>
          <a 
            href="#booking-form" 
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-primary bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
          >
            Get a Quote Now
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 ml-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </a>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-1/3 h-full max-w-md hidden lg:block">
        <svg 
          viewBox="0 0 100 100" 
          className="absolute inset-0 h-full w-full opacity-20" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,0 L100,0 L100,100 L0,100 Z" 
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
