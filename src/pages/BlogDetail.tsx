import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlog } from "@/hooks/useApi";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft, User } from "lucide-react";
import { isHtmlContent, sanitizeBlogHtml, stripHtml } from "@/lib/blogContent";

const SITE_URL = "https://www.drinksavenue.co.ke";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: blog, loading, error } = useBlog(slug || '', Boolean(slug));

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-900">
        <Navigation />
        <main className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            Loading blog post...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background text-slate-900">
        <Navigation />
        <main className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700 shadow-sm">
            {error ? `Unable to load blog: ${error}` : 'Blog post not found.'}
            <div className="mt-6">
              <Button asChild>
                <Link to="/blog">Back to blog</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const canonicalUrl = `${SITE_URL}/blog/${blog.slug || blog.id}`;
  const metaDescription = stripHtml(blog.excerpt || blog.content).slice(0, 160);
  const socialImage = blog.featuredImage || `${SITE_URL}/logo.png`;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
    "headline": blog.title,
    "description": metaDescription,
    "image": socialImage,
    "url": canonicalUrl,
    "datePublished": blog.createdAt,
    "dateModified": blog.updatedAt,
    ...(blog.tags?.length ? { "keywords": blog.tags.join(', ') } : {}),
    "author": {
      "@type": blog.author ? "Person" : "Organization",
      "name": blog.author || "Drinks Avenue",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Drinks Avenue",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` },
    },
    "isPartOf": { "@id": `${SITE_URL}/blog#blog` },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
      { "@type": "ListItem", "position": 3, "name": blog.title, "item": canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Helmet>
        <title>{`${blog.title} | Drinks Avenue Blog`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Drinks Avenue" />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="article:published_time" content={blog.createdAt} />
        <meta property="article:modified_time" content={blog.updatedAt} />
        {blog.author && <meta property="article:author" content={blog.author} />}
        {blog.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <meta name="twitter:card" content={blog.featuredImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={socialImage} />
        <script type="application/ld+json">{JSON.stringify(blogPostingSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-wine">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/blog" className="hover:text-wine">Blog</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="truncate text-slate-700">{blog.title}</li>
            </ol>
          </nav>

          <article>
            <header className="space-y-1.5">
              <time
                dateTime={blog.createdAt}
                className="text-[11px] font-bold uppercase tracking-wide text-wine"
              >
                {new Date(blog.createdAt)
                  .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  .toUpperCase()}
              </time>

              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  {blog.author || 'Drinks Avenue'}
                </span>
                {blog.tags && blog.tags.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {blog.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                    ))}
                  </span>
                )}
              </div>
            </header>

            {blog.featuredImage && (
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="mt-4 max-h-56 w-full rounded-xl border border-slate-200 bg-white object-cover"
              />
            )}

            <div className="mt-5">
              {blog.excerpt && (
                <p className="mb-4 text-sm font-medium leading-6 text-slate-800">
                  {stripHtml(blog.excerpt)}
                </p>
              )}
              {isHtmlContent(blog.content) ? (
                <div
                  className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-lg prose-h3:text-base prose-p:my-2.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-a:text-wine prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(blog.content) }}
                />
              ) : (
                <div className="space-y-4 text-sm leading-6 text-slate-700">
                  {blog.content.split(/\n\n+/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </article>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link to="/blog" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to blog
              </Link>
            </Button>
            <span className="text-xs text-slate-500">
              Updated <time dateTime={blog.updatedAt}>{new Date(blog.updatedAt).toLocaleDateString()}</time>
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetail;
