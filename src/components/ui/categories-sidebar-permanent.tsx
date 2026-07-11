import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Phone } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

interface Category {
  name: string;
  path: string;
  icon?: string;
  subcategories?: Array<{ name: string; path: string }>;
}

interface CategoriesSidebarPermanentProps {
  categories: Category[];
  isLoading?: boolean;
}

const SIDEBAR_WIDTH_PX = 224; // w-56 — keep in sync with index.css sidebar margin (14rem)

export function CategoriesSidebarPermanent({ categories, isLoading }: CategoriesSidebarPermanentProps) {
  const location = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const siteUrl = (import.meta.env.VITE_SITE_URL?.trim() || "https://www.drinksavenue.co.ke").replace(/\/+$/, "");

  // SiteNavigationElement schema helps Google understand site structure and
  // surface category sitelinks in search results
  const navigationSchema = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Drinks Avenue Categories",
      "itemListElement": categories.map((category, index) => ({
        "@type": "SiteNavigationElement",
        "position": index + 1,
        "name": category.name,
        "url": `${siteUrl}${category.path}`
      }))
    };
  }, [categories, siteUrl]);

  const isActiveCategory = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleCategoryMouseEnter = (categoryPath: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredCategory(categoryPath);
  };

  const handleCategoryMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredCategory(null), 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <aside className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-30 lg:flex lg:w-56 lg:flex-col overflow-visible" aria-label="Category navigation">
      {navigationSchema && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(navigationSchema)}</script>
        </Helmet>
      )}
      <div className="flex h-full flex-col overflow-y-auto overflow-x-visible bg-white border-r border-slate-200 scrollbar-hide">

        {/* Compact header (span, not h2 — avoids duplicate headings on every page) */}
        <div className="px-4 pt-4 pb-2.5 border-b border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Shop by Category
          </span>
        </div>

        {/* Category list */}
        <nav className="flex-1 px-2 py-2 space-y-0.5" aria-label="Product categories">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-slate-50 text-xs text-slate-500">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-wine border-t-transparent animate-spin" />
              Loading categories…
            </div>
          ) : categories.length === 0 ? (
            <div className="px-3 py-3 rounded-lg bg-slate-50 text-xs text-slate-500">No categories available</div>
          ) : (
            categories.map((category) => {
              const active = isActiveCategory(category.path);
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;
              const isHovered = hoveredCategory === category.path;

              return (
                <div
                  key={category.path}
                  ref={(el) => { categoryRefs.current[category.path] = el; }}
                  className="group relative"
                  onMouseEnter={() => handleCategoryMouseEnter(category.path)}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  <Link
                    to={category.path}
                    title={category.path === "/" ? "Drinks Avenue — 24 hour alcohol delivery Nairobi" : `${category.name} delivery in Nairobi & Kenya — order online`}
                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-100 ${
                      active
                        ? "bg-wine/10 text-wine"
                        : "text-slate-700 hover:text-wine hover:bg-slate-50"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 rounded-full bg-wine" />
                    )}

                    <span className="truncate flex-1">{category.name}</span>

                    {hasSubcategories && (
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform duration-100 ${
                          isHovered ? "rotate-90 text-wine" : "text-slate-300"
                        }`}
                      />
                    )}
                  </Link>

                  {/* Subcategory flyout */}
                  {hasSubcategories && isHovered && (
                    <div
                      className="fixed w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] py-1.5"
                      style={{
                        left: `${SIDEBAR_WIDTH_PX + 4}px`,
                        top: (() => {
                          const el = categoryRefs.current[category.path];
                          if (!el) return 96;
                          const rect = el.getBoundingClientRect();
                          return Math.min(rect.top, window.innerHeight - (category.subcategories!.length * 34 + 16));
                        })(),
                      }}
                      onMouseEnter={() => handleCategoryMouseEnter(category.path)}
                      onMouseLeave={handleCategoryMouseLeave}
                    >
                      {category.subcategories!.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          title={`${sub.name} delivery in Nairobi & Kenya`}
                          onClick={() => {
                            setHoveredCategory(null);
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                              hoverTimeoutRef.current = null;
                            }
                          }}
                          className={`flex items-center px-3 py-1.5 mx-1.5 text-xs rounded-md transition-colors duration-100 ${
                            location.pathname === sub.path
                              ? "bg-wine/10 text-wine font-semibold"
                              : "text-slate-600 hover:text-wine hover:bg-slate-50"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Compact contact strip */}
        <div className="mt-auto px-2 py-2 border-t border-slate-100">
          <a
            href="tel:+254790831798"
            title="Call Drinks Avenue — 24 hour drinks delivery"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-wine/5 hover:text-wine"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine text-white">
              <Phone className="h-3 w-3" />
            </span>
            <span>
              <span className="block font-semibold text-[13px]">0790 831798</span>
              <span className="block text-[10px] text-slate-400">Open 24/7 — fast delivery</span>
            </span>
          </a>
        </div>
      </div>
    </aside>
  );
}
