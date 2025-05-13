import { Calendar, Truck, Clock, CheckCircle } from 'lucide-react';

export function ProcessSection() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple Process, Superior Service
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our streamlined rental process makes it easy to get the dumpster you need, when you need it.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <ProcessStep 
            number="1"
            icon={<Calendar className="h-8 w-8 text-primary" />}
            title="Book Online" 
            description="Fill out our simple booking form to select your dumpster size and preferred delivery date."
          />
          <ProcessStep 
            number="2"
            icon={<Truck className="h-8 w-8 text-primary" />}
            title="We Deliver" 
            description="Our team delivers your dumpster on time and places it exactly where you need it."
          />
          <ProcessStep 
            number="3"
            icon={<Clock className="h-8 w-8 text-primary" />}
            title="Fill It Up" 
            description="Take your time filling the dumpster with your debris during your rental period."
          />
          <ProcessStep 
            number="4"
            icon={<CheckCircle className="h-8 w-8 text-primary" />}
            title="We Pick Up" 
            description="When you're done, we'll pick up the dumpster and properly dispose of all materials."
          />
        </div>

        <div className="mt-16 bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Behind the Scenes
              </h3>
              <p className="text-gray-600 mb-6">
                Our team works diligently to ensure your dumpster rental experience is seamless from start to finish. We handle all the logistics, permits, and disposal so you can focus on your project.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Environmentally Responsible</h4>
                    <p className="text-sm text-gray-600">We recycle and properly dispose of all materials according to local regulations.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Property Protection</h4>
                    <p className="text-sm text-gray-600">We use special boards to protect your driveway from damage during delivery and pickup.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Flexible Scheduling</h4>
                    <p className="text-sm text-gray-600">Need more time? No problem. We offer flexible rental extensions to accommodate your project timeline.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-200 h-full">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                alt="Our team in action" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessStep({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 relative z-10">
          {icon}
        </div>
        <div className="absolute top-0 left-0 w-16 h-16 bg-primary/10 rounded-full transform translate-x-1 translate-y-1"></div>
      </div>
      <div className="absolute top-0 right-0 bg-primary text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}