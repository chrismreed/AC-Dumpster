import { Link } from "wouter";

export function Hero() {
  return (
    <section className="relative bg-[#2c2c2c] text-white py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h4 className="text-white font-medium mb-2">EFFINGHAM, IL DUMPSTER RENTALS</h4>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">GOT TOO MUCH JUNK?</h1>
          <p className="text-2xl font-medium mb-3">WE CAN HELP!</p>
          <p className="text-xl mb-8">RENT A DUMPSTER FOR AS LOW AS <span className="text-white font-bold">$340</span></p>
          
          <div className="flex flex-wrap gap-4">
            <a 
              href="#booking-form" 
              className="inline-flex items-center px-8 py-3 border border-transparent rounded-sm shadow-sm text-base font-bold text-[#2c2c2c] bg-white hover:bg-gray-100 focus:outline-none uppercase"
            >
              RENT NOW
            </a>
            <a 
              href="#pricing" 
              className="inline-flex items-center px-8 py-3 border border-white rounded-sm shadow-sm text-base font-medium text-white bg-transparent hover:bg-[#333] focus:outline-none uppercase"
            >
              VIEW PRICING
            </a>
          </div>
        </div>
      </div>
      
      <div className="absolute right-0 bottom-0 w-2/5 h-4/5 hidden lg:block">
        <img 
          src="https://www.alleycatdumpsterrental.com/wp-content/uploads/2023/02/alley-cat-dumpster.png" 
          alt="Alley Cat Dumpster" 
          className="object-contain h-full w-full"
        />
      </div>
    </section>
  );
}
