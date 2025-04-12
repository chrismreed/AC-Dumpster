import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    {
      question: "What size dumpster do I need?",
      answer: "The size you need depends on your project. For smaller home cleanouts, a 10-yard dumpster is usually sufficient. For medium renovation projects, consider a 15 or 20-yard dumpster. Large construction or complete home renovations typically require 30-yard dumpsters. You can view our size guide for more specific recommendations."
    },
    {
      question: "How long can I keep the dumpster?",
      answer: "Our standard rental period is 3 days, but we offer flexible options from 3 to 14 days. If you need more time, you can extend your rental through your account or by contacting customer service. Extension fees apply and are calculated on a per-day basis."
    },
    {
      question: "What can't I put in the dumpster?",
      answer: "Prohibited items include hazardous materials (paint, oil, chemicals), tires, batteries, appliances with freon, electronics, and certain types of yard waste. Please contact us if you're unsure about specific items. Improper disposal of prohibited items may result in additional fees."
    },
    {
      question: "Do I need a permit for my dumpster?",
      answer: "If you're placing the dumpster on your private property (like a driveway), you typically don't need a permit. However, if you need to place it on a public street, most cities require a permit. We can help guide you through the permit process or, in some areas, obtain the permit on your behalf for an additional fee."
    },
    {
      question: "What happens if I exceed the weight limit?",
      answer: "Each dumpster size comes with a specific weight allowance. If you exceed this limit, overage fees will apply, typically charged per ton. You can purchase additional weight allowance upfront at a discounted rate if you expect to exceed the standard limit."
    }
  ];

  return (
    <section className="py-12 bg-neutral-50" id="faq">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white shadow-sm rounded-lg">
                <AccordionTrigger className="px-6 py-4 text-left font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-neutral-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
