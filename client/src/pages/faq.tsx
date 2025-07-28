import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";

export default function FAQPage() {
  const faqCategories = [
    {
      title: "General Questions",
      questions: [
        {
          question: "What sizes of dumpsters do you offer?",
          answer: "We offer 10-yard, 20-yard, and 30-yard dumpsters. A 10-yard is perfect for small cleanouts and bathroom renovations, 20-yard works well for kitchen remodels and garage cleanouts, and 30-yard is ideal for large construction projects and whole-house cleanouts."
        },
        {
          question: "How much weight is included in the rental?",
          answer: "All our dumpster rentals include 2,000 lbs of debris at no extra charge. This covers most residential projects. Additional weight beyond 2,000 lbs is charged at competitive rates."
        },
        {
          question: "What areas do you serve?",
          answer: "We serve Effingham, Illinois and surrounding communities within a 30-mile radius. This includes Altamont, Teutopolis, Dieterich, Beecher City, and many other nearby towns."
        },
        {
          question: "How quickly can you deliver a dumpster?",
          answer: "We offer same-day delivery when available, and typically deliver within 24-48 hours of booking. During busy seasons, we recommend booking 2-3 days in advance."
        }
      ]
    },
    {
      title: "Booking & Pricing",
      questions: [
        {
          question: "How do I book a dumpster rental?",
          answer: "You can book online through our website, call us at (217) 994-2582, or text us. Our online booking system provides instant quotes and allows you to schedule delivery for your preferred date."
        },
        {
          question: "What's included in the rental price?",
          answer: "Our rental price includes delivery, pickup, disposal fees for up to 2,000 lbs, and up to 7 days of rental time (or your selected rental period). No hidden fees or surprise charges."
        },
        {
          question: "Do you charge extra for same-day delivery?",
          answer: "Yes, same-day delivery includes an additional fee when available. The exact fee depends on your location and our current schedule. This option is perfect for urgent projects."
        },
        {
          question: "What forms of payment do you accept?",
          answer: "We accept all major credit cards, debit cards, and cash. Payment is required at the time of booking for online orders, or can be paid upon delivery for phone orders."
        }
      ]
    },
    {
      title: "What Can Go In",
      questions: [
        {
          question: "What materials can I put in the dumpster?",
          answer: "You can dispose of construction debris, household junk, furniture, appliances, yard waste, and general trash. We also offer free electronics recycling for items like TVs, computers, and small appliances."
        },
        {
          question: "What items are prohibited?",
          answer: "Hazardous materials including paint, chemicals, batteries, tires, and liquids are not allowed. Also prohibited are asbestos materials, medical waste, and flammable substances."
        },
        {
          question: "Can I put electronics in the dumpster?",
          answer: "Yes! We offer free electronics recycling. You can include TVs, computers, printers, and other electronic devices. We ensure these items are recycled responsibly."
        },
        {
          question: "What about appliances?",
          answer: "Most appliances are accepted, including refrigerators, washers, dryers, and stoves. Refrigerants are properly removed and recycled according to environmental regulations."
        }
      ]
    },
    {
      title: "Delivery & Pickup",
      questions: [
        {
          question: "Where can the dumpster be placed?",
          answer: "Dumpsters can be placed on driveways, streets (permit may be required), or other flat, accessible areas. We use protective boards to prevent damage to driveways and surfaces."
        },
        {
          question: "Do I need a permit?",
          answer: "Permits are typically required for street placement in most municipalities. We can help you understand local requirements, but obtaining permits is the customer's responsibility."
        },
        {
          question: "What if I need the dumpster longer?",
          answer: "You can extend your rental period for additional days at a daily rate. Just call us before your scheduled pickup date to arrange an extension."
        },
        {
          question: "What if I fill it up early?",
          answer: "If you fill the dumpster before your rental period ends, we can pick it up early at no extra charge. Just give us a call to schedule an early pickup."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="h-16 w-16 text-[#f7c948] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked <span className="text-[#f7c948]">Questions</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Find answers to common questions about our dumpster rental services, 
              booking process, and policies.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                  <Badge variant="outline" className="bg-[#f7c948] text-black border-[#f7c948]">
                    {category.title}
                  </Badge>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem 
                          key={faqIndex} 
                          value={`item-${categoryIndex}-${faqIndex}`}
                          className="border-b border-gray-200 last:border-b-0"
                        >
                          <AccordionTrigger className="text-left font-semibold hover:text-[#f7c948] transition-colors">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 pt-2">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Quick Tips for Success</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Choose the Right Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    When in doubt, go one size larger. It's more cost-effective than ordering a second dumpster.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Load Efficiently</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Break down large items and distribute weight evenly. Fill empty spaces with smaller debris.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plan Ahead</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Book 2-3 days in advance during busy seasons to ensure availability for your preferred dates.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-[#f7c948]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Still Have Questions?</h2>
          <p className="text-xl text-black/80 mb-8">
            Our friendly team is here to help with any questions or concerns you may have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-black text-white hover:bg-gray-800 font-bold"
              asChild
            >
              <a href="tel:(217) 994-2582">
                <Phone className="mr-2 h-5 w-5" />
                Call (217) 994-2582
              </a>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white font-bold"
              asChild
            >
              <Link href="/contact">
                Send Us a Message
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0f172a] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Get an instant quote and book your dumpster rental in minutes
          </p>
          <Button 
            size="lg"
            className="bg-[#f7c948] text-black hover:bg-[#f7c948]/90 font-bold"
            asChild
          >
            <Link href="/#booking-form">
              Book Your Dumpster Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}