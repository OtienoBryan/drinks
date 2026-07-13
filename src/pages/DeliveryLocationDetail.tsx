import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft, Clock, MapPin, ShoppingBag, Truck } from "lucide-react";
import { useDeliveryLocation, useDeliveryLocations } from "@/hooks/useApi";
import { DeliveryLocation } from "@/services/api";
import { slugify } from "@/lib/slug";

const SITE_URL = "https://www.drinksavenue.co.ke";

const CATEGORY_LINKS = [
  { name: "Wine", path: "/category/wine" },
  { name: "Beer", path: "/category/beer" },
  { name: "Whisky", path: "/category/whisky" },
  { name: "Gin", path: "/category/gin" },
  { name: "Vodka", path: "/category/vodka" },
];

const DeliveryLocationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: location, loading, error } = useDeliveryLocation(slug || '', Boolean(slug));
  const { data: allLocations } = useDeliveryLocations();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-900">
        <Navigation />
        <main className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Loading delivery location...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-background text-slate-900">
        <Navigation />
        <main className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700 shadow-sm">
            {error ? `Unable to load location: ${error}` : 'Delivery location not found.'}
            <div className="mt-6">
              <Button asChild>
                <Link to="/delivery-locations">View all delivery locations</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const canonicalUrl = `${SITE_URL}/delivery-locations/${slugify(location.name)}`;
  const pageTitle = `Alcohol Delivery in ${location.name} - 24/7 Drinks Delivery | Drinks Avenue`;
  const metaDescription = (
    location.description ||
    `Fast alcohol delivery in ${location.name}. Order wine, beer, whisky, gin, and vodka online from Drinks Avenue and get drinks delivered to your doorstep in ${location.name}, 24/7.`
  ).slice(0, 160);

  const faqs = [
    {
      question: `How fast is drinks delivery in ${location.name}?`,
      answer: `We offer express delivery in ${location.name}, with most orders arriving within 30–60 minutes. Same-day delivery is available for all orders across ${location.name} and surrounding areas.`,
    },
    {
      question: `What drinks can I order for delivery in ${location.name}?`,
      answer: `You can order wine, beer, whisky, gin, vodka, champagne, and more for delivery in ${location.name}. Browse hundreds of drinks on Drinks Avenue and pay securely with M-Pesa or card.`,
    },
    {
      question: `Is alcohol delivery in ${location.name} available at night?`,
      answer: `Yes. Drinks Avenue operates 24 hours a day, 7 days a week, so you can order drinks in ${location.name} any time — day or night.`,
    },
  ];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl}#service`,
    "serviceType": "Alcohol delivery",
    "name": `Alcohol Delivery in ${location.name}`,
    "description": metaDescription,
    "url": canonicalUrl,
    "provider": { "@id": `${SITE_URL}/#organization` },
    "areaServed": {
      "@type": "Place",
      "name": location.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": location.name,
        "addressCountry": "KE",
      },
    },
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Delivery Locations", "item": `${SITE_URL}/delivery-locations` },
      { "@type": "ListItem", "position": 3, "name": location.name, "item": canonicalUrl },
    ],
  };

  const otherLocations = (allLocations || [])
    .filter((loc: DeliveryLocation) => loc.id !== location.id)
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Drinks Avenue" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/logo.png`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-wine">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/delivery-locations" className="hover:text-wine">Delivery Locations</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-slate-700">{location.name}</li>
            </ol>
          </nav>

          <article>
            <header className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-wine">Delivery Area</p>
              <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                <MapPin className="h-6 w-6 flex-shrink-0 text-wine" aria-hidden="true" />
                Alcohol Delivery in {location.name}
              </h1>
            </header>

            {location.description && (
              <p className="mt-3 text-sm font-medium leading-6 text-slate-800">{location.description}</p>
            )}

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Drinks Avenue delivers wine, beer, whisky, gin, vodka, champagne, and more to {location.name} —
              24 hours a day, 7 days a week. Browse hundreds of drinks online, pay securely with M-Pesa or card,
              and have your order brought straight to your doorstep in {location.name}.
            </p>

            {/* Highlights */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <Truck className="h-5 w-5 flex-shrink-0 text-wine" aria-hidden="true" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Express delivery</p>
                  <p className="text-slate-600">30–60 min in {location.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-wine" aria-hidden="true" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Open 24/7</p>
                  <p className="text-slate-600">Order day or night</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
                <ShoppingBag className="h-5 w-5 flex-shrink-0 text-wine" aria-hidden="true" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Huge selection</p>
                  <p className="text-slate-600">Wine, beer, spirits &amp; more</p>
                </div>
              </div>
            </div>

            {/* Shop categories - internal links */}
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">
                Popular drinks delivered in {location.name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORY_LINKS.map((category) => (
                  <Link
                    key={category.path}
                    to={category.path}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-wine/40 hover:text-wine"
                  >
                    {category.name} delivery in {location.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* FAQs - visible content matching the FAQPage schema */}
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">
                Drinks delivery in {location.name} — FAQs
              </h2>
              <div className="mt-2 space-y-3">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-xl border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-900 marker:text-wine">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="mt-6 flex flex-col gap-3 rounded-xl bg-wine/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Order drinks in {location.name} now</h2>
                <p className="mt-0.5 text-xs text-slate-600">Fast delivery, secure M-Pesa and card payments.</p>
              </div>
              <Button asChild className="w-fit">
                <Link to="/">Start Shopping</Link>
              </Button>
            </div>
          </article>

          {/* Other locations - internal links */}
          {otherLocations.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-bold text-slate-900">We also deliver to</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {otherLocations.map((loc: DeliveryLocation) => (
                  <Link
                    key={loc.id}
                    to={`/delivery-locations/${slugify(loc.name)}`}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-wine/40 hover:text-wine"
                  >
                    {loc.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 border-t border-slate-200 pt-4">
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link to="/delivery-locations" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                All delivery locations
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DeliveryLocationDetail;
