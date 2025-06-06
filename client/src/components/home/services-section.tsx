import { Button } from "@/components/ui/button";
import { ArrowRight, CheckIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dumpster } from "@shared/schema";

export function ServicesSection() {
  const { data: dumpsters, isLoading } = useQuery<Dumpster[]>({
    queryKey: ["/api/dumpsters"],
  });

  const getDumpsterCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('10') || lowerName.includes('small')) return 'Small Projects';
    if (lowerName.includes('20') || lowerName.includes('medium')) return 'Medium Projects';
    if (lowerName.includes('30') || lowerName.includes('large')) return 'Large Projects';
    return 'Various Projects';
  };

  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
            Choose the Right Size for Your Project
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer a variety of dumpster sizes to fit your specific needs, whether it's a small home cleanout or a major construction project.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : dumpsters && dumpsters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dumpsters.map((dumpster, index) => (
              <div 
                key={dumpster.id} 
                className={`border ${index === 1 ? 'border-2 border-[#facc15] scale-105 z-10' : 'border-[#d1d5db]'} rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white relative`}
              >
                {index === 1 && (
                  <div className="absolute -top-1 right-0 bg-[#facc15] text-[#111827] font-bold py-2 px-6 text-sm rounded-bl-lg shadow-md">
                    POPULAR
                  </div>
                )}
                <div className="text-[#ffffff] p-6 text-center bg-[#454238]">
                  <h3 className="text-2xl font-bold">{dumpster.name}</h3>
                  <p className="text-gray-300 mt-1">{getDumpsterCategory(dumpster.name)}</p>
                </div>
                <div className="p-8">
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-[#111827]">${(dumpster.basePrice / 100).toFixed(0)}</p>
                    <p className="text-gray-500">24-hour rental included</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <div className="bg-[#facc15]/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                        <CheckIcon className="h-4 w-4 text-[#facc15]" />
                      </div>
                      <p className="text-[#111827]">Dimensions: {dumpster.dimensions}</p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-[#facc15]/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                        <CheckIcon className="h-4 w-4 text-[#facc15]" />
                      </div>
                      <p className="text-[#111827]">Weight Capacity: {(dumpster.weightLimit / 2000).toFixed(1)} tons</p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-[#facc15]/10 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                        <CheckIcon className="h-4 w-4 text-[#facc15]" />
                      </div>
                      <p className="text-[#111827]">{dumpster.description}</p>
                    </div>

                  </div>
                  <Button 
                    className={`w-full ${index === 1 ? 'bg-[#facc15] hover:bg-[#eab308] text-[#111827] font-bold' : 'bg-[#0f172a] hover:bg-[#0f172a]/90 text-[#ffffff]'} py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300`} 
                    asChild
                  >
                    <a href="#booking-form" className="flex justify-center items-center">
                      Rent Now {index === 1 && <ArrowRight className="ml-2 h-5 w-5" />}
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              No dumpsters available at the moment. Please check back later.
            </p>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Not sure which size is right for your project? Give us a call and our experts will help you choose.
          </p>
          <Button className="bg-[#0f172a] hover:bg-[#0f172a]/90 text-[#ffffff] py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <a href="tel:5551234567" className="font-medium text-lg">Call (217) 994-2582</a>
          </Button>
        </div>
      </div>
    </section>
  );
}