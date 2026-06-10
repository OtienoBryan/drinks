import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Clock } from "lucide-react";
import { useBlogs } from "@/hooks/useApi";
import { BlogPost } from "@/services/api";

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

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Helmet>
        <title>Blog | Drinks Avenue</title>
        <meta
          name="description"
          content="Read the latest blog stories, delivery tips, and beverage guides from Drinks Avenue."
        />
        <link rel="canonical" href="https://www.drinksavenue.co.ke/blog" />
      </Helmet>

      <Navigation />

      <section className="relative overflow-hidden bg-gradient-to-br from-wine/10 via-transparent to-gold/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-wine/20 bg-wine/5 px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-wine">
              Drinks Avenue Blog
            </p>
            <h1 className="text-4xl font-bold sm:text-5xl">Stories, guides, and delivery tips for every drink lover.</h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600">
              Discover news from the store, flavour guides, and helpful articles for ordering wine, beer, spirits, and more in Kenya.
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Latest posts</h2>
            <p className="mt-2 text-sm text-slate-500">
              Browse our curated selection of blog articles for drinks delivery, product tips, and lifestyle ideas.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label htmlFor="blog-search" className="sr-only">
              Search posts
            </label>
            <div className="relative">
              <input
                id="blog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-wine focus:ring-2 focus:ring-wine/20"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              Loading blog posts...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              Failed to load blog posts: {error}
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post: BlogPost) => (
              <Card key={post.id} className="group overflow-hidden border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <CardHeader className="space-y-3 p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{post.tags?.[0] ?? 'Blog'}</Badge>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-semibold text-slate-900">{post.title}</CardTitle>
                    <p className="text-sm text-slate-600">{post.excerpt || post.content?.slice(0, 140) + '...'}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
                  <div className="text-sm text-slate-500">
                    <p>{post.author || 'Drinks Avenue'}</p>
                    <p>{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-wine hover:text-wine/80">
                    <Link to={`/blog/${post.slug || post.id}`}>Read more</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              No blog posts matched your search.
            </div>
          )}
        </div>
      </main>

      <Separator />
      <Footer />
    </div>
  );
};

export default Blog;
