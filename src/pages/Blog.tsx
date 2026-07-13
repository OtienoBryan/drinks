import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useBlogs } from "@/hooks/useApi";
import { BlogPost } from "@/services/api";
import { stripHtml } from "@/lib/blogContent";

const SITE_URL = "https://www.drinksavenue.co.ke";

const formatCardDate = (date: string) =>
  new Date(date)
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: blogPosts, loading, error } = useBlogs();

  const filteredPosts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!blogPosts || !blogPosts.length) return [];
    if (!query) return blogPosts;

    return blogPosts.filter((post) =>
      post.title?.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.content?.toLowerCase().includes(query) ||
      post.author?.toLowerCase().includes(query) ||
      post.tags?.join(' ').toLowerCase().includes(query)
    );
  }, [searchQuery, blogPosts]);

  const blogSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    "name": "Drinks Avenue Blog",
    "description": "Drinks guides, cocktail ideas, and bottle notes from Drinks Avenue Kenya.",
    "url": `${SITE_URL}/blog`,
    "publisher": { "@id": `${SITE_URL}/#organization` },
    "blogPost": (blogPosts || []).slice(0, 20).map((post: BlogPost) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "url": `${SITE_URL}/blog/${post.slug || post.id}`,
      "datePublished": post.createdAt,
      "dateModified": post.updatedAt,
      ...(post.excerpt ? { "description": stripHtml(post.excerpt).slice(0, 160) } : {}),
      ...(post.featuredImage ? { "image": post.featuredImage } : {}),
      "author": {
        "@type": post.author ? "Person" : "Organization",
        "name": post.author || "Drinks Avenue",
      },
    })),
  }), [blogPosts]);

  const breadcrumbSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
    ],
  }), []);

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Helmet>
        <title>Blog - Drinks Guides, Cocktail Ideas &amp; Bottle Notes | Drinks Avenue</title>
        <meta
          name="description"
          content="Drinks guides, cocktail ideas, and bottle notes from Drinks Avenue — wine, whisky, beer, and spirits tips with fast delivery across Kenya."
        />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Drinks Avenue" />
        <meta property="og:title" content="Drinks Avenue Blog - Drinks Guides, Cocktail Ideas & Bottle Notes" />
        <meta
          property="og:description"
          content="Drinks guides, cocktail ideas, and bottle notes for wine, beer, whisky, and spirits lovers in Kenya."
        />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
        <meta property="og:image" content={`${SITE_URL}/logo.png`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Drinks Avenue Blog - Drinks Guides, Cocktail Ideas & Bottle Notes" />
        <meta
          name="twitter:description"
          content="Drinks guides, cocktail ideas, and bottle notes for wine, beer, whisky, and spirits lovers in Kenya."
        />
        <script type="application/ld+json">{JSON.stringify(blogSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <span className="inline-block h-6 w-1.5 rounded-sm bg-wine" aria-hidden="true" />
              Blog
            </h1>
            <p className="mt-0.5 text-xs text-slate-600">Drinks guides, cocktail ideas, and bottle notes.</p>
          </div>

          <div className="w-full max-w-xs">
            <label htmlFor="blog-search" className="sr-only">
              Search posts
            </label>
            <input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts..."
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-wine focus:ring-2 focus:ring-wine/20"
            />
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              Loading blog posts...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              Failed to load blog posts: {error}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {filteredPosts.map((post: BlogPost) => (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Link to={`/blog/${post.slug || post.id}`} className="flex h-full flex-col">
                    <div className="h-32 w-full overflow-hidden border-b border-slate-100 bg-white">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-3xl" aria-hidden="true">
                          🍷
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <time
                        dateTime={post.createdAt}
                        className="text-[11px] font-bold uppercase tracking-wide text-wine"
                      >
                        {formatCardDate(post.createdAt)}
                      </time>
                      <h2 className="text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-wine line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">
                        {stripHtml(post.excerpt || post.content || '').slice(0, 160)}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              No blog posts matched your search.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
