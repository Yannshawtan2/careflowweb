import { Section, Container, Prose } from "@/components/ds";
import DefaultHeader from "@/components/DefaultHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import logo from "@/images/logo.png";

export default function Home() {
  return (
    <>
      <DefaultHeader />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </>
  );
}

const Hero = () => {
  return (
    <Section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
      <Container>
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <Image src={logo} alt="CareFlow Logo" className="h-16 w-16" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your
            <span className="text-green-600"> Healthcare</span>
            <br />
            Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Comprehensive healthcare management platform for Nursing Homes. 
            Manage patients, billing, inventory, and staff all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/donate">
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3">
                Support Our Mission
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
};

const Features = () => {
  const features = [
    {
      title: "Patient Management",
      description: "Comprehensive patient records, health history, and emergency contacts all in one secure system.",
      icon: "👥",
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Electronic Health Records",
      description: "Digital clinical notes, treatment plans, and medical history with secure access controls.",
      icon: "📋",
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Billing & Payments",
      description: "Streamlined billing, subscription management, and payment processing with Stripe integration.",
      icon: "💳",
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Inventory Management",
      description: "Track medical supplies, equipment, and medications with automated alerts and reporting.",
      icon: "📦",
      color: "bg-orange-100 text-orange-600"
    },
    {
      title: "Staff Dashboard",
      description: "Role-based access for doctors, nurses, and administrative staff with real-time updates.",
      icon: "🏥",
      color: "bg-red-100 text-red-600"
    },
    {
      title: "Donation Campaigns",
      description: "Raise funds for medical equipment, research, and community health initiatives.",
      icon: "❤️",
      color: "bg-pink-100 text-pink-600"
    }
  ];

  return (
    <Section className="py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Run Your Practice
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From patient care to financial management, CareFlow provides all the tools 
            healthcare professionals need to deliver exceptional care.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};

const Stats = () => {
  const stats = [
    { number: "10,000+", label: "Patients Served" },
    { number: "500+", label: "Healthcare Providers" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <Section className="bg-green-600 py-16">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="text-white">
              <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
              <div className="text-green-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};



const CTA = () => {
  return (
    <Section className="py-20">
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of healthcare professionals who trust CareFlow to manage their practice efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/donate">
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3">
                Make a Donation
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <Container>
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Image src={logo} alt="CareFlow Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-semibold">CareFlow</span>
            </div>
            <p className="text-gray-400">
              Empowering healthcare professionals with comprehensive management solutions.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#" className="hover:text-white">Features</Link></li>
              <li><Link href="#" className="hover:text-white">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white">Security</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#" className="hover:text-white">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-white">Status</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#" className="hover:text-white">About</Link></li>
              <li><Link href="/donate" className="hover:text-white">Donate</Link></li>
              <li><Link href="#" className="hover:text-white">Privacy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 CareFlow. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};
