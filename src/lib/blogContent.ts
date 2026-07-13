import DOMPurify from "dompurify";

// Blog content is authored in a rich-text (Quill) editor and stored as HTML.
export const isHtmlContent = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

export const sanitizeBlogHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });

// Plain-text version for meta descriptions and card excerpts.
export const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
