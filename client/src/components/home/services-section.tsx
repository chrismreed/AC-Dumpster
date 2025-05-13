import { ArrowRight, ChevronRight, Trash2, Recycle, Building, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">Our Services</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The Right Dumpster for Every Project
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer a variety of dumpster sizes to accommodate any project, from small home cleanouts to large construction jobs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <ServiceCard
            icon={<Home className="h-10 w-10 text-primary" />}
            title="Residential"
            description="Perfect for home renovations, garage cleanouts, and yard waste removal."
            link="#booking-form"
          />
          <ServiceCard
            icon={<Building className="h-10 w-10 text-primary" />}
            title="Commercial"
            description="Ideal for office renovations, retail remodels, and business cleanouts."
            link="#booking-form"
          />
          <ServiceCard
            icon={<Trash2 className="h-10 w-10 text-primary" />}
            title="Construction"
            description="Built to handle heavy debris, concrete, and construction materials."
            link="#booking-form"
          />
          <ServiceCard
            icon={<Recycle className="h-10 w-10 text-primary" />}
            title="Junk Removal"
            description="Let us do the heavy lifting with our full-service junk removal option."
            link="#booking-form"
          />
        </div>

        <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Not Sure What Size You Need?
              </h3>
              <p className="text-gray-600 mb-6">
                Our experts can help you choose the right dumpster size for your project. We'll consider the type of debris, project duration, and space restrictions to recommend the perfect solution.
              </p>
              <Button variant="outline" className="font-medium">
                <a href="#contact" className="flex items-center">
                  Get Expert Advice <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                <h4 className="font-bold text-gray-900 mb-1">10 Yard</h4>
                <p className="text-primary font-bold text-2xl mb-2">$350</p>
                <p className="text-gray-500 text-sm">Small projects & cleanouts</p>
                <p className="text-xs text-gray-400 mt-2">12ft × 8ft × 4ft</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                <h4 className="font-bold text-gray-900 mb-1">20 Yard</h4>
                <p className="text-primary font-bold text-2xl mb-2">$450</p>
                <p className="text-gray-500 text-sm">Medium renovations</p>
                <p className="text-xs text-gray-400 mt-2">16ft × 8ft × 4ft</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                <h4 className="font-bold text-gray-900 mb-1">30 Yard</h4>
                <p className="text-primary font-bold text-2xl mb-2">$550</p>
                <p className="text-gray-500 text-sm">Large remodels</p>
                <p className="text-xs text-gray-400 mt-2">22ft × 8ft × 6ft</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                <h4 className="font-bold text-gray-900 mb-1">40 Yard</h4>
                <p className="text-primary font-bold text-2xl mb-2">$650</p>
                <p className="text-gray-500 text-sm">Construction projects</p>
                <p className="text-xs text-gray-400 mt-2">22ft × 8ft × 8ft</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ 
  icon, 
  title, 
  description, 
  link 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  link: string;
}) {
  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="ghost" className="text-primary p-0 hover:bg-transparent hover:text-primary/80">
          <a href={link} className="flex items-center">
            Book Now <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}