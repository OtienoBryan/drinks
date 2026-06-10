import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBlog } from "@/hooks/useApi";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Clock } from "lucide-react";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: blog, loading, error } = useBlog(slug || '', Boolean(slug));

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-900">
        <Navigation />
        <main className="container mx-auto px-4 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
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
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700 shadow-sm">
            {error ? `Unable to load blog: ${error}` : 'Blog post not found.'}
            <div className="mt-6">
              <Button asChild>
                <Link to="/blog">Back to blog list</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Helmet>
        <title>{blog.title} | Drinks Avenue</title>
        <meta name="description" content={blog.excerpt || blog.content.slice(0, 160)} />
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl space-y-8">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {blog.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                {new Date(blog.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-slate-900">{blog.title}</h1>
              <p className="text-sm text-slate-500">By {blog.author || 'Drinks Avenue'} · {blog.isPublished ? 'Published' : 'Draft'}</p>
            </div>

            {blog.featuredImage && (
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full rounded-3xl border border-slate-200 object-cover"
              />
            )}

            <div className="prose prose-slate max-w-none text-slate-700">
              {blog.excerpt && <p className="text-base leading-8">{blog.excerpt}</p>}
              {blog.content.split(/\n\n/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild>
              <Link to="/blog">Back to blog list</Link>
            </Button>
            <span className="text-sm text-slate-500">Updated {new Date(blog.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </main>

      <Separator />
      <Footer />
    </div>
  );
};

export default BlogDetail;
