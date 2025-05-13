import { Check, X } from 'lucide-react';

export function ComparisonSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">Why Choose Us</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The Alley Cat Difference
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how we compare to other dumpster rental services and why more customers choose us.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left border-b-2 border-gray-200"></th>
                <th className="p-4 text-center border-b-2 border-gray-200 bg-gray-50">
                  <span className="text-lg font-bold text-gray-900">Other Providers</span>
                </th>
                <th className="p-4 text-center border-b-2 border-primary bg-primary/5">
                  <span className="text-lg font-bold text-primary">Alley Cat Dumpster Rental</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow 
                feature="Transparent Pricing" 
                competitors={false}
                us={true}
                description="No hidden fees or surprise charges. What we quote is what you pay."
              />
              <ComparisonRow 
                feature="Same-Day Delivery" 
                competitors={false}
                us={true}
                description="Need a dumpster right away? We often offer same-day service when available."
              />
              <ComparisonRow 
                feature="Flexible Rental Periods" 
                competitors={true}
                us={true}
                description="Need more time? No problem. We offer flexible extensions at reasonable rates."
              />
              <ComparisonRow 
                feature="Local, Family-Owned Business" 
                competitors={false}
                us={true}
                description="We're your neighbors, not a faceless corporation. We care about our community."
              />
              <ComparisonRow 
                feature="Driveway Protection" 
                competitors={false}
                us={true}
                description="We place boards under all dumpsters to protect your property."
              />
              <ComparisonRow 
                feature="Proper Placement" 
                competitors={true}
                us={true}
                description="We'll place the dumpster exactly where you need it, maximizing convenience."
              />
              <ComparisonRow 
                feature="Online Booking" 
                competitors={true}
                us={true}
                description="Easy online booking system that lets you reserve your dumpster 24/7."
              />
              <ComparisonRow 
                feature="Environmentally Responsible" 
                competitors={false}
                us={true}
                description="We recycle as much waste as possible to minimize environmental impact."
              />
              <ComparisonRow 
                feature="Responsive Customer Service" 
                competitors={false}
                us={true}
                description="Quick response times and real people answering your calls and emails."
              />
            </tbody>
          </table>
        </div>
        
        <div className="mt-12 bg-gray-50 rounded-xl p-8 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Ready to Experience the Difference?
              </h3>
              <p className="text-gray-600">
                Book your dumpster rental today and see why we're Effingham's preferred waste solution.
              </p>
            </div>
            <div className="flex-shrink-0">
              <a 
                href="#booking-form" 
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none"
              >
                Rent a Dumpster Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonRow({ 
  feature, 
  competitors, 
  us, 
  description 
}: { 
  feature: string; 
  competitors: boolean; 
  us: boolean; 
  description: string;
}) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50/50">
      <td className="p-4 text-left">
        <div className="font-medium text-gray-900">{feature}</div>
        <div className="text-sm text-gray-600 mt-1">{description}</div>
      </td>
      <td className="p-4 text-center">
        {competitors ? (
          <Check className="h-5 w-5 text-green-500 mx-auto" />
        ) : (
          <X className="h-5 w-5 text-red-500 mx-auto" />
        )}
      </td>
      <td className="p-4 text-center bg-primary/5">
        {us ? (
          <Check className="h-5 w-5 text-primary mx-auto" />
        ) : (
          <X className="h-5 w-5 text-red-500 mx-auto" />
        )}
      </td>
    </tr>
  );
}