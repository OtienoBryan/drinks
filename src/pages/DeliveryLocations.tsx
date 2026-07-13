import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MapPin } from "lucide-react";
import { useDeliveryLocations } from "@/hooks/useApi";
import { DeliveryLocation } from "@/services/api";
import { slugify } from "@/lib/slug";

const SITE_URL = "https://www.drinksavenue.co.ke";

const DeliveryLocations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: locations, loading, error } = useDeliveryLocations();

  const filteredLocations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!locations || !locations.length) return [];
    if (!query) return locations;

    return locations.filter((location) =>
      location.name?.toLowerCase().includes(query) ||
      location.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, locations]);

  const itemListSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Drinks Avenue Delivery Locations",
    "description": "Areas served by Drinks Avenue for alcohol and drinks delivery in Kenya.",
    "url": `${SITE_URL}/delivery-locations`,
    "itemListElement": (locations || []).map((location: DeliveryLocation, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Place",
        "name": location.name,
        "url": `${SITE_URL}/delivery-locations/${slugify(location.name)}`,
        ...(location.description ? { "description": location.description } : {}),
      },
    })),
  }), [locations]);

  const breadcrumbSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Delivery Locations", "item": `${SITE_URL}/delivery-locations` },
    ],
  }), []);

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Helmet>
        <title>Delivery Locations - Alcohol Delivery Areas in Kenya | Drinks Avenue</title>
        <meta
          name="description"
          content="See all areas Drinks Avenue delivers to across Nairobi and Kenya. Fast alcohol delivery — wine, beer, whisky, and spirits brought to your doorstep 24/7."
        />
        <link rel="canonical" href={`${SITE_URL}/delivery-locations`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Drinks Avenue" />
        <meta property="og:title" content="Drinks Avenue Delivery Locations - Alcohol Delivery Areas in Kenya" />
        <meta
          property="og:description"
          content="Check if we deliver to your area. Fast drinks delivery across Nairobi and Kenya, 24/7."
        />
        <meta property="og:url" content={`${SITE_URL}/delivery-locations`} />
        <meta property="og:image" content={`${SITE_URL}/logo.png`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Drinks Avenue Delivery Locations - Alcohol Delivery Areas in Kenya" />
        <meta
          name="twitter:description"
          content="Check if we deliver to your area. Fast drinks delivery across Nairobi and Kenya, 24/7."
        />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <span className="inline-block h-6 w-1.5 rounded-sm bg-wine" aria-hidden="true" />
              Delivery Locations
            </h1>
            <p className="mt-0.5 text-xs text-slate-600">
              Areas we deliver to across Nairobi and Kenya — drinks at your doorstep, 24/7.
            </p>
          </div>

          <div className="w-full max-w-xs">
            <label htmlFor="location-search" className="sr-only">
              Search locations
            </label>
            <input
              id="location-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your area..."
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-wine focus:ring-2 focus:ring-wine/20"
            />
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              Loading delivery locations...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              Failed to load delivery locations: {error}
            </div>
          ) : filteredLocations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLocations.map((location: DeliveryLocation) => (
                <Link
                  key={location.id}
                  to={`/delivery-locations/${slugify(location.name)}`}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-wine/30 hover:shadow-md"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-wine/10">
                    <MapPin className="h-5 w-5 text-wine" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-wine">
                      {location.name}
                    </h2>
                    {location.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {location.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              {searchQuery
                ? "No delivery locations matched your search."
                : "Delivery locations will be listed here soon."}
              <p className="mt-2 text-sm">
                Not sure if we cover your area?{' '}
                <Link to="/contact" className="font-medium text-wine hover:underline">
                  Contact us
                </Link>{' '}
                and we'll confirm.
              </p>
            </div>
          )}
        </div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Fast drinks delivery near you</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Drinks Avenue delivers wine, beer, whisky, gin, vodka, and more across Nairobi and the
            wider Kenya — 24 hours a day, 7 days a week. Order online and get your favourite drinks
            delivered to your doorstep in minutes. Don't see your area listed?{' '}
            <Link to="/contact" className="font-medium text-wine hover:underline">Get in touch</Link>{' '}
            and we'll confirm coverage, or{' '}
            <Link to="/" className="font-medium text-wine hover:underline">start shopping now</Link>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DeliveryLocations;
