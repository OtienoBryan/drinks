import { Link } from "react-router-dom";
import { Phone, MapPin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer
      className="bg-gray-900 text-white"
      aria-label="Site footer"
      itemScope
      itemType="https://schema.org/WPFooter"
    >
      <div
        className="container mx-auto px-3 sm:px-4 py-3 sm:py-4"
        itemScope
        itemType="https://schema.org/LocalBusiness"
      >
        <meta itemProp="name" content="Drinks Avenue" />
        <meta itemProp="telephone" content="+254790831798" />
        <meta itemProp="email" content="support@drinksavenue.com" />
        <meta itemProp="url" content="https://www.drinksavenue.co.ke/" />
        <meta itemProp="priceRange" content="$$" />
        {/* Compact 4-Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Company Info */}
          <div className="space-y-3 sm:space-y-2">
            <h3 className="text-base font-semibold text-white" itemProp="name">Drinks Avenue</h3>
            <p className="text-gray-300 text-xs leading-snug" itemProp="description">
              Nairobi's 24 hour alcohol delivery service — the online liquor store near you, delivering whisky, wine, beer, gin &amp; spirits across Nairobi and Kenya.
            </p>
            <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress" className="hidden">
              <meta itemProp="addressLocality" content="Nairobi" />
              <meta itemProp="addressCountry" content="KE" />
              <meta itemProp="addressRegion" content="Nairobi County" />
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.facebook.com/dalalidrinks"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Drinks Avenue on Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://x.com/dalalidrinks"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Drinks Avenue on X (Twitter)"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/dalalidrinks"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Drinks Avenue on Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white">Shop</h4>
            <ul className="grid grid-cols-2 gap-2 text-xs leading-snug">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/category/beer" className="text-gray-300 hover:text-white transition-colors">Beer</Link></li>
              <li><Link to="/category/wine" className="text-gray-300 hover:text-white transition-colors">Wine</Link></li>
              <li><Link to="/category/whisky" className="text-gray-300 hover:text-white transition-colors">Whisky</Link></li>
              <li><Link to="/category/gin" className="text-gray-300 hover:text-white transition-colors">Gin</Link></li>
              <li><Link to="/category/vodka" className="text-gray-300 hover:text-white transition-colors">Vodka</Link></li>
              <li><Link to="/offers" className="text-gray-300 hover:text-white transition-colors">Offers</Link></li>
              <li><Link to="/featured" className="text-gray-300 hover:text-white transition-colors">Featured</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white">Support</h4>
            <ul className="grid grid-cols-2 gap-2 text-xs leading-snug">
              <li><Link to="/orders" className="text-gray-300 hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/account" className="text-gray-300 hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/brands" className="text-gray-300 hover:text-white transition-colors">Brands</Link></li>
              <li><Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/delivery-locations" className="text-gray-300 hover:text-white transition-colors">Delivery Areas</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">FAQ &amp; Help</Link></li>
              <li className="sm:col-span-2"><a href="/sitemap.xml" className="text-gray-300 hover:text-white transition-colors">Sitemap</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white">Contact</h4>
            <div className="space-y-2 text-xs leading-snug">
              <a href="tel:+254790831798" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                0790 831798
              </a>
              <a href="mailto:support@drinksavenue.com" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                support@drinksavenue.com
              </a>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                Nairobi, Kenya
              </div>
              <p className="text-gray-400 text-xs">Open 24 hours / 7 days</p>
            </div>
          </div>
        </div>

        {/* Popular Searches - internal keyword links for SEO */}
        <div className="border-t border-gray-800 mt-3 pt-3">
          <h4 className="text-xs font-semibold text-white mb-2">Popular Searches</h4>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">24 Hour Alcohol Delivery</Link>
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Liquor Store Near Me</Link>
            <Link to="/category/whisky" className="text-gray-400 hover:text-white transition-colors">Whisky Hub Kenya</Link>
            <Link to="/category/wine" className="text-gray-400 hover:text-white transition-colors">Wine Delivery Nairobi</Link>
            <Link to="/category/beer" className="text-gray-400 hover:text-white transition-colors">Beer Delivery Kenya</Link>
            <Link to="/category/gin" className="text-gray-400 hover:text-white transition-colors">Gin Delivery</Link>
            <Link to="/offers" className="text-gray-400 hover:text-white transition-colors">Drinks Offers This Week</Link>
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Late Night Drinks Delivery</Link>
          </div>
        </div>

        {/* Compact Bottom Bar */}
        <div className="border-t border-gray-800 mt-3 pt-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-400 text-xs text-center sm:text-left">
              © {new Date().getFullYear()} Drinks Avenue. All rights reserved. Must be 18+ to order.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <Link to="/contact#privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/contact#terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <a href="/sitemap.xml" className="text-gray-400 hover:text-white transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
