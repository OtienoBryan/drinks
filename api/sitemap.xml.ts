const API_BASE_URL = process.env.VITE_API_URL || 'http://139.59.2.43:5000';

export default async function handler(
  request: any,
  response: any,
) {
  try {
    const baseUrl = request.headers.host 
      ? `${request.headers['x-forwarded-proto'] || 'https'}://${request.headers.host}`
      : 'https://drinksavenue.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Fetch all data
    const [productsResponse, categoriesResponse, blogsResponse, locationsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/products`).catch(() => null),
      fetch(`${API_BASE_URL}/api/categories`).catch(() => null),
      fetch(`${API_BASE_URL}/api/blogs`).catch(() => null),
      fetch(`${API_BASE_URL}/api/delivery-locations`).catch(() => null)
    ]);

    const products = productsResponse?.ok ? await productsResponse.json().catch(() => []) : [];
    const categories = categoriesResponse?.ok ? await categoriesResponse.json().catch(() => []) : [];
    const blogs = blogsResponse?.ok ? await blogsResponse.json().catch(() => []) : [];
    const deliveryLocations = locationsResponse?.ok ? await locationsResponse.json().catch(() => []) : [];

    // Extract unique brands and origins from products
    const brands = new Set<string>();
    const origins = new Set<string>();
    
    (products || []).forEach((product: any) => {
      if (product.brand) {
        brands.add(product.brand);
      }
      if (product.origin) {
        origins.add(product.origin);
      }
    });

    // Build sitemap XML
    const urls: string[] = [];

    // Static pages - high priority
    urls.push(`  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${baseUrl}/offers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${baseUrl}/featured</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${baseUrl}/brands</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${baseUrl}/origin</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${baseUrl}/delivery-locations</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);

    // Delivery location pages - local SEO landing pages
    (deliveryLocations || []).forEach((location: any) => {
      if (location.name) {
        const locationSlug = location.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        urls.push(`  <url>
    <loc>${baseUrl}/delivery-locations/${locationSlug}</loc>
    <lastmod>${location.updatedAt ? new Date(location.updatedAt).toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    });

    // Blog posts - fresh content boosts crawl frequency and domain authority
    (blogs || []).forEach((blog: any) => {
      if (blog.slug || blog.id) {
        urls.push(`  <url>
    <loc>${baseUrl}/blog/${encodeURIComponent(blog.slug || blog.id)}</loc>
    <lastmod>${blog.updatedAt ? new Date(blog.updatedAt).toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    });

    // Category pages - high priority
    (categories || []).forEach((category: any) => {
      if (category.name) {
        urls.push(`  <url>
    <loc>${baseUrl}/category/${encodeURIComponent(category.name.toLowerCase())}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);
      }
    });

    // Brand pages - medium-high priority
    Array.from(brands).forEach((brand) => {
      urls.push(`  <url>
    <loc>${baseUrl}/brands/${encodeURIComponent(brand)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    // Origin pages - medium-high priority
    Array.from(origins).forEach((origin) => {
      urls.push(`  <url>
    <loc>${baseUrl}/origin/${encodeURIComponent(origin)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    // Product pages - highest priority
    (products || []).forEach((product: any) => {
      if (product.id && product.isActive !== false) {
        urls.push(`  <url>
    <loc>${baseUrl}/product/${product.id}</loc>
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
      }
    });

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>`;

    // Set headers and return XML
    response.setHeader('Content-Type', 'application/xml; charset=utf-8');
    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    response.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback to basic sitemap
    const baseUrl = request.headers.host 
      ? `${request.headers['x-forwarded-proto'] || 'https'}://${request.headers.host}`
      : 'https://drinksavenue.com';
    const currentDate = new Date().toISOString().split('T')[0];
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/offers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/featured</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/brands</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/origin</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
    
    response.setHeader('Content-Type', 'application/xml; charset=utf-8');
    response.status(200).send(fallbackXml);
  }
}
