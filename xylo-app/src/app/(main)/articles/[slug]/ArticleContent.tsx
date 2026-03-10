"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

interface ArticleContentProps {
  html: string;
}

export default function ArticleContent({ html }: ArticleContentProps) {
  const sanitizedHtml = useMemo(() => {
    if (typeof window === "undefined") return html;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s", "h2", "h3",
        "ul", "ol", "li", "blockquote", "pre", "code",
        "a", "hr", "div", "span",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "style", "dir"],
    });
  }, [html]);

  return (
    <div
      className="article-content prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-loose"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
