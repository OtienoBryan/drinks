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
    <aside className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col overflow-visible">
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-visible bg-white border-r border-gray-100 shadow-sm scrollbar-hide">

        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Browse</p>
          <h2 className="text-sm font-bold text-gray-900 mt-0.5">Categories</h2>
        </div>

        {/* Category list */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-visible" aria-label="Product categories">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="w-4 h-4 rounded-full border-2 border-wine border-t-transparent animate-spin" />
              <span className="text-sm text-gray-400">Loading…</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-400">No categories available</div>
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
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                      active
                        ? "bg-wine/10 text-wine"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {/* Active left border accent */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-wine rounded-full" />
                    )}

                    <span className="truncate">{category.name}</span>

                    {hasSubcategories && (
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
                          isHovered ? "rotate-90" : ""
                        } ${active ? "text-wine/60" : "text-gray-300"}`}
                      />
                    )}
                  </Link>

                  {/* Subcategory flyout */}
                  {hasSubcategories && isHovered && (
                    <div
                      className="fixed w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-[9999] py-2"
                      style={{
                        left: "272px",
                        top: (() => {
                          const el = categoryRefs.current[category.path];
                          if (!el) return 80;
                          const rect = el.getBoundingClientRect();
                          return Math.min(rect.top, window.innerHeight - (category.subcategories!.length * 40 + 16));
                        })(),
                      }}
                      onMouseEnter={() => handleSubcategoryMouseEnter(category.path)}
                      onMouseLeave={handleSubcategoryMouseLeave}
                    >
                      <div className="px-3 pb-2 mb-1 border-b border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{category.name}</p>
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
                          className={`flex items-center gap-2 px-3 py-2 mx-1 text-sm rounded-lg transition-all duration-150 ${
                            location.pathname === sub.path
                              ? "bg-wine/10 text-wine font-medium"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          <span className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
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
        <div className="px-4 py-4 border-t border-gray-100 space-y-1">
          <a
            href="tel:+254790831798"
            className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-wine transition-colors group"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-wine/10 transition-colors">
              <Phone className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-semibold text-gray-600 group-hover:text-wine transition-colors">0790 831798</p>
              <p className="text-[10px] text-gray-400">Open 24 hours / 7 days</p>
            </div>
          </a>
        </div>
      </div>
    </aside>
  );
}
