import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Send,
  CheckCircle,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    inquiryType: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        inquiryType: "general"
      });
    }, 2000);
  };

  const contactInfo = [
    {
      icon: <Phone className="h-5 w-5" />,
      title: "Phone",
      details: ["0790 831798"],
      description: "Call us for immediate assistance"
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Email",
      details: ["support@drinksavenue.com"],
      description: "Email us anytime, we respond within 24 hours"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Location",
      details: ["Nairobi, Kenya"],
      description: "Delivering across Nairobi and Kenya"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Business Hours",
      details: ["24 Hours / 7 Days a Week"],
      description: "We're always here to help you"
    }
  ];

  const inquiryTypes = [
    { value: "general", label: "General Inquiry" },
    { value: "order", label: "Order Support" },
    { value: "delivery", label: "Delivery Issue" },
    { value: "product", label: "Product Question" },
    { value: "complaint", label: "Complaint" },
    { value: "suggestion", label: "Suggestion" },
    { value: "partnership", label: "Partnership" }
  ];

  const siteUrl = "https://www.drinksavenue.co.ke";
  const canonicalUrl = `${siteUrl}/contact`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How fast is delivery?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer 30-minute express delivery for urgent orders and same-day delivery for regular orders across Nairobi and Kenya. Free delivery is available on qualifying orders."
        }
      },
      {
        "@type": "Question",
        "name": "What are your business hours?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Drinks Avenue operates 24 hours a day, 7 days a week. You can place orders any time and our team will fulfil them promptly."
        }
      },
      {
        "@type": "Question",
        "name": "Do you have age verification?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we require age verification for all alcohol purchases in compliance with Kenyan law. You must be 18 years or older to place an order."
        }
      },
      {
        "@type": "Question",
        "name": "Can I cancel my order?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can cancel your order within 15 minutes of placing it. After that, please contact us immediately on 0790 831798 for assistance."
        }
      },
      {
        "@type": "Question",
        "name": "Which areas do you deliver to?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We deliver premium drinks across Nairobi and the wider Kenya. Contact us to confirm delivery availability in your specific area."
        }
      }
    ]
  };

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Drinks Avenue",
    "description": "Contact Drinks Avenue for 24 hour drinks delivery in Kenya. Reach us by phone, email, or our contact form.",
    "url": canonicalUrl,
    "mainEntity": {
      "@type": "Organization",
      "name": "Drinks Avenue",
      "telephone": "+254-790-831798",
      "email": "support@drinksavenue.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nairobi",
        "addressCountry": "KE"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+254-790-831798",
        "contactType": "customer service",
        "availableLanguage": ["English", "Swahili"],
        "areaServed": "KE",
        "hoursAvailable": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact Us | Drinks Avenue - 24 Hour Drinks Delivery Kenya</title>
        <meta name="description" content="Contact Drinks Avenue for 24 hour drinks delivery in Nairobi and Kenya. Call 0790 831798 or send us a message. Fast response, 24/7 customer support for all your drinks delivery needs." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Contact Us | Drinks Avenue - 24/7 Drinks Delivery Kenya" />
        <meta property="og:description" content="Get in touch with Drinks Avenue for alcohol delivery in Nairobi and Kenya. Call 0790 831798. 24/7 customer support available." />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${siteUrl}/logo.png`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Contact Drinks Avenue - 24/7 Kenya Drinks Delivery" />
        <meta name="twitter:description" content="Reach our team for fast drinks delivery across Nairobi and Kenya. Call 0790 831798 or use our contact form." />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(contactPageSchema)}</script>
      </Helmet>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-wine/10 to-gold/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-wine mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                24/7 Support
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                Live Chat Available
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                Emergency Orders
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-wine">Send us a Message</CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="inquiryType" className="text-sm font-medium">
                        Inquiry Type
                      </label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        {inquiryTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What's this about?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-wine hover:bg-wine-light text-white"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-wine mb-4">Contact Information</h2>
                <p className="text-muted-foreground mb-6">
                  Choose the most convenient way to reach us. We're here to help with any questions or concerns.
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-wine/10 rounded-lg text-wine">
                          {info.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{info.title}</h3>
                          <div className="space-y-1">
                            {info.details.map((detail, idx) => (
                              <p key={idx} className="text-muted-foreground">
                                {detail}
                              </p>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Social Media */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <Button variant="outline" size="icon">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-wine mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">How fast is delivery?</h3>
                  <p className="text-muted-foreground">
                    We offer fast delivery across Nairobi and Kenya. Orders are processed promptly and delivered fresh to your doorstep. Free delivery is available on qualifying orders.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">What are your business hours?</h3>
                  <p className="text-muted-foreground">
                    We operate 24 hours a day, 7 days a week. You can place orders any time — day or night — and our team will fulfil them as quickly as possible.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Do you have age verification?</h3>
                  <p className="text-muted-foreground">
                    Yes, we require age verification for all alcohol purchases in compliance with Kenyan law. You must be 18 years or older to place an order.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Can I cancel my order?</h3>
                  <p className="text-muted-foreground">
                    You can cancel your order within 15 minutes of placing it. After that, please call us immediately on 0790 831798 for further assistance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-wine text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Drinks Avenue</h3>
            <p className="text-wine-light mb-4">
              Premium drinks delivered fast to your doorstep
            </p>
            <p className="text-sm text-wine-light">
              © 2024 Drinks Avenue. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
