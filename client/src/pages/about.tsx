import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Award, Clock, Heart } from "lucide-react";
import { Link } from "wouter";

export default function AboutPage() {
  const values = [
    {
      icon: <Heart className="h-8 w-8 text-[#f7c948]" />,
      title: "Family Values",
      description: "As a family-owned business, we treat every customer like family and take pride in our personal service."
    },
    {
      icon: <Award className="h-8 w-8 text-[#f7c948]" />,
      title: "Quality Service",
      description: "We maintain the highest standards in our equipment, delivery times, and customer support."
    },
    {
      icon: <Clock className="h-8 w-8 text-[#f7c948]" />,
      title: "Reliability",
      description: "Count on us for on-time delivery, fair pricing, and dependable service every single time."
    },
    {
      icon: <Users className="h-8 w-8 text-[#f7c948]" />,
      title: "Community Focus",
      description: "Proudly serving Effingham and surrounding communities with local expertise and commitment."
    }
  ];

  const milestones = [
    {
      year: "2021",
      title: "Company Founded",
      description: "Started as a family business with a single truck and big dreams."
    },
    {
      year: "2022",
      title: "Fleet Expansion",
      description: "Added multiple dumpster sizes and expanded our service area."
    },
    {
      year: "2023",
      title: "200+ Customers",
      description: "Reached our milestone of serving over 200 satisfied customers."
    },
    {
      year: "2024",
      title: "Technology Upgrade",
      description: "Launched online booking system for faster, easier service."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="text-[#f7c948]">Alley Cat Dumpster Rental</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              A family-owned business serving Effingham and surrounding communities 
              with reliable, affordable dumpster rental solutions since 2021.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Alley Cat Dumpster Rental was born from a simple idea: provide honest, 
                    reliable dumpster rental services to our neighbors in Effingham and 
                    surrounding communities. As a family-owned business, we understand the 
                    importance of trust, quality service, and fair pricing.
                  </p>
                  <p>
                    Since our founding in 2021, we've grown from a single truck operation 
                    to serving hundreds of customers across Central Illinois. Our commitment 
                    to excellence has made us the go-to choice for residential cleanouts, 
                    construction projects, and everything in between.
                  </p>
                  <p>
                    What sets us apart is our personal approach to service. We're not just 
                    a rental company – we're your neighbors, and we take pride in helping 
                    our community tackle their projects with confidence.
                  </p>
                </div>
              </div>
              <div className="bg-[#f7c948] p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Our Mission</h3>
                <p className="text-black/80">
                  To provide Effingham area residents and businesses with reliable, 
                  affordable dumpster rental services while maintaining the highest 
                  standards of customer service and environmental responsibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      {value.icon}
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{value.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#f7c948] rounded-full flex items-center justify-center">
                      <span className="font-bold text-black text-sm">{milestone.year}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#0f172a] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">By the Numbers</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold text-[#f7c948] mb-2">200+</div>
                <div className="text-gray-300">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#f7c948] mb-2">3</div>
                <div className="text-gray-300">Years in Business</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#f7c948] mb-2">5⭐</div>
                <div className="text-gray-300">Average Rating</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#f7c948] mb-2">24hr</div>
                <div className="text-gray-300">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f7c948]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to Work with Us?</h2>
          <p className="text-xl text-black/80 mb-8">
            Experience the Alley Cat difference for your next project
          </p>
          <Button 
            size="lg"
            className="bg-black text-white hover:bg-gray-800 font-bold"
            asChild
          >
            <Link href="/#booking-form">
              Get Your Quote Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}