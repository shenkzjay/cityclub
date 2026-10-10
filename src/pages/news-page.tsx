import { useParams, Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trpc } from "../client/trpc";

export default function NewsPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading, isError } = trpc.getNews.useQuery(
    { slug: slug ?? "" },
    { enabled: Boolean(slug) }
  );

  if (isLoading) {
    return <div className="p-6">Loading article...</div>;
  }

  if (isError || !article) {
    return (
      <div className="p-6">
        <h1>Article Not Found</h1>
        <p>The news article you're looking for doesn't exist.</p>
        <Link to="/" className="text-black underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <section className="bg-white pb-20">
      <article className="max-w-3xl mx-auto p-6 prose prose-lg">
        <Link to="/" className="text-black mb-4 inline-block">
          &larr; Back to Home
        </Link>
        {article.coverImage && (
          <img
            src={article.coverImage}
            alt=""
            className="w-full rounded-xl mb-6"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        {article.date && <p className="text-sm text-gray-500 mb-2">{article.date}</p>}
        <h1>{article.title}</h1>
        <div className="markdown-content text-black">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </div>
      </article>
    </section>
  );
}