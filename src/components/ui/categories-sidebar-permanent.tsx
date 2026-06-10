import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Phone } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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

export function CategoriesSidebarPermanent({ categories, isLoading }: CategoriesSidebarPermanentProps) {
  const location = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSubcategoryMouseEnter = (categoryPath: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredCategory(categoryPath);
  };

  const handleSubcategoryMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredCategory(null), 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <aside className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col overflow-visible">
      <div className="flex h-full flex-col overflow-y-auto overflow-x-visible bg-gradient-to-b from-white via-slate-50 to-slate-100 border-r border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.08)] scrollbar-hide">

        {/* Sidebar header */}
        <div className="px-5 pt-6 pb-5 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Browse</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Shop by Category</h2>
          <p className="mt-2 text-sm text-slate-500">Discover our most popular product categories and explore fresh arrivals.</p>
        </div>

        {/* Category list */}
        <nav className="flex-1 px-4 py-4 space-y-2" aria-label="Product categories">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-4 rounded-3xl bg-slate-50 text-sm text-slate-500">
              <div className="w-4 h-4 rounded-full border-2 border-wine border-t-transparent animate-spin" />
              Loading categories…
            </div>
          ) : categories.length === 0 ? (
            <div className="px-3 py-4 rounded-3xl bg-slate-50 text-sm text-slate-500">No categories available</div>
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
                    className={`relative flex items-center justify-between gap-3 px-4 py-3 rounded-3xl text-sm font-semibold transition-all duration-150 ${
                      active
                        ? "bg-wine/10 text-wine shadow-sm ring-1 ring-wine/20"
                        : "text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3/4 w-1.5 rounded-full bg-wine" />
                    )}

                    <span className="truncate pl-1">{category.name}</span>

                    {hasSubcategories && (
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                          isHovered ? "rotate-90 text-slate-500" : "text-slate-300"
                        }`}
                      />
                    )}
                  </Link>

                  {/* Subcategory flyout */}
                  {hasSubcategories && isHovered && (
                    <div
                      className="fixed w-56 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[9999] py-2"
                      style={{
                        left: "292px",
                        top: (() => {
                          const el = categoryRefs.current[category.path];
                          if (!el) return 96;
                          const rect = el.getBoundingClientRect();
                          return Math.min(rect.top, window.innerHeight - (category.subcategories!.length * 44 + 20));
                        })(),
                      }}
                      onMouseEnter={() => handleSubcategoryMouseEnter(category.path)}
                      onMouseLeave={handleSubcategoryMouseLeave}
                    >
                      <div className="px-4 pb-2 mb-2 border-b border-slate-200">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{category.name}</p>
                      </div>
                      {category.subcategories!.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => {
                            setHoveredCategory(null);
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                              hoverTimeoutRef.current = null;
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-3 mx-2 text-sm rounded-2xl transition-all duration-150 ${
                            location.pathname === sub.path
                              ? "bg-wine/10 text-wine font-semibold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
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

        {/* Bottom contact strip */}
        <div className="mt-auto px-5 py-5 border-t border-slate-200 bg-white/95 backdrop-blur-xl">
          <a
            href="tel:+254790831798"
            className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-wine hover:bg-wine/5 hover:text-wine"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wine text-white shadow-sm">
              <Phone className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold">Need help?</p>
              <p className="text-xs text-slate-500">Call 0790 831798 — open 24/7</p>
            </div>
          </a>
        </div>
      </div>
    </aside>
  );
}
