import {
  Zap,
  MapPin,
  DollarSign,
  Calendar,
  Recycle,
  Headphones
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: <Zap className="text-xl" />,
      title: "Fast & Easy Booking",
      description: "Book your dumpster in minutes with our simple online process. Get instant quotes and schedule delivery without calling around."
    },
    {
      icon: <MapPin className="text-xl" />,
      title: "Local Service",
      description: "We're a local company that knows your area. Our team understands local regulations and can help with permit requirements if needed."
    },
    {
      icon: <DollarSign className="text-xl" />,
      title: "Transparent Pricing",
      description: "No hidden fees or surprises. Our upfront pricing includes delivery, pickup, and a specified weight allowance with any overage fees clearly explained."
    },
    {
      icon: <Calendar className="text-xl" />,
      title: "Flexible Scheduling",
      description: "Choose your preferred delivery and pickup dates. Need to extend your rental? No problem - easily add days through your online account."
    },
    {
      icon: <Recycle className="text-xl" />,
      title: "Responsible Disposal",
      description: "We ensure your waste is properly sorted and recycled where possible to minimize environmental impact and comply with local regulations."
    },
    {
      icon: <Headphones className="text-xl" />,
      title: "Dedicated Support",
      description: "Our customer service team is always ready to help with any questions or concerns. Reach us by phone, email, or chat during business hours."
    }
  ];

  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose DumpsterDirect</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="bg-primary bg-opacity-10 text-primary rounded-full p-3 mr-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-neutral-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
