import { useParams, Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";

// Import all markdown files (same as in HomePage)
const newsModules = import.meta.glob("../news-content/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

export default function NewsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      return;
    }

    // Reconstruct the expected path
    const expectedPath = `../news-content/${slug}.md`;

    if (expectedPath in newsModules) {
      setContent(newsModules[expectedPath] as string);
    } else {
      setNotFound(true);
    }
  }, [slug]);

  if (notFound) {
    return (
      <div className="p-6">
        <h1>Article Not Found</h1>
        <p>The news article you're looking for doesn't exist.</p>
      </div>
    );
  }

  if (!content) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <article className="max-w-3xl mx-auto p-6 prose prose-lg">
      <Link to="/" className="text-blue-600 mb-4 inline-block">
        &larr; Back to Home
      </Link>
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </article>
  );
}
