import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function ImprovedFAQ() {
  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-semibold">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our dumpster rental services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">What makes your dumpsters "driveway-friendly"?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  Our small roll-off containers are specifically designed to fit on residential driveways without causing damage. They're compact enough to navigate tight spaces while still providing ample capacity for your waste disposal needs, making them perfect for home projects and renovations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">What's included in your base pricing?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  Our base price includes the dumpster rental, delivery, pickup, and disposal of up to 2,000 lbs of waste. Service within 10 miles of Effingham is included. If you exceed the 2,000 lb limit, there's an $80 charge for each additional ton.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">What can I put in the dumpster?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  You can dispose of general household waste, construction debris, yard waste, and furniture. Items NOT allowed: tires, batteries, electronics, appliances, wet paint, dirt, rock, and concrete. However, we offer free recycling for batteries, electronics, and appliances if you place them next to the dumpster!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">How much notice do you need for delivery?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  We recommend booking 1-2 days in advance to ensure availability, especially during busy seasons. However, we often can accommodate same-day delivery requests depending on our schedule. For weekend deliveries, please book by Thursday to guarantee availability.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">Do I need to be present for delivery or pickup?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  No, you don't need to be present as long as we have clear instructions on where to place the dumpster. However, it can be helpful to be there during delivery to ensure optimal placement. For pickup, just make sure the dumpster is accessible and not blocked by vehicles or debris.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-6" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">How much does a dumpster rental cost?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  Our pricing starts at $340 for a 10-yard dumpster. Prices vary based on size, rental duration, and materials being disposed of. All our prices include delivery, pickup, and standard disposal fees. We're transparent about pricing and don't add hidden fees. Contact us for a specific quote based on your needs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">What areas do you service?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  We serve Effingham, Illinois and the surrounding area within a 10-mile radius at no additional charge. For locations beyond 10 miles from Effingham, we apply a fuel surcharge but are happy to provide service to most of central Illinois.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">Do I need a permit for a dumpster?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  Permits are typically not required if the dumpster is placed on your private property. However, if you need to place it on a public street or right-of-way, local regulations may require a permit. We can advise you on the permit requirements for your specific location and help guide you through the process if needed.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">What happens if I overload the dumpster?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  For safety and legal reasons, dumpsters cannot be loaded beyond the top edge (overfilled). If your dumpster is overfilled, we may need to remove items before transport or charge an additional fee based on the extra volume. We'll always communicate with you before any additional charges are applied.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border-b-0 bg-white rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                  <span className="font-semibold text-gray-900">How do I pay for my rental?</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 text-gray-600">
                  We handle payment through email invoicing with secure payment options. After booking, you'll receive an invoice via email with easy-to-use payment links. We accept major credit cards and electronic payments for your convenience.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="bg-primary/10 rounded-full p-4 md:p-5">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Have More Questions?
              </h3>
              <p className="text-gray-600 mb-0 md:mb-4">
                Our team is ready to help. Contact us and we'll be happy to assist you with any questions or concerns.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button asChild size="lg">
                <a href="#contact">Contact Us</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}