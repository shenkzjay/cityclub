import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AdminLayout } from "../layout";
import { trpc } from "../../client/trpc";

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NewsAdmin() {
  const utils = trpc.useUtils();

  const { data: articles = [], isLoading } = trpc.newsList.useQuery();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");

  const invalidateNews = () => {
    utils.newsList.invalidate();
    utils.getNews.invalidate();
  };

  const creator = trpc.newsCreate.useMutation({
    onSuccess: () => {
      invalidateNews();
      resetForm();
    },
    onError: (error) => alert(`Could not save article: ${error.message}`),
  });

  const updater = trpc.newsUpdate.useMutation({
    onSuccess: () => {
      invalidateNews();
      resetForm();
    },
    onError: (error) => alert(`Could not update article: ${error.message}`),
  });

  const deleter = trpc.newsDelete.useMutation({
    onSuccess: () => invalidateNews(),
    onError: (error) => alert(`Could not delete article: ${error.message}`),
  });

  const isSaving = creator.isPending || updater.isPending;

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setCoverImage("");
    setContent("");
  }

  const handleEdit = async (article: {
    id: number;
    slug: string;
    title: string;
    date: string;
    coverImage: string | null;
  }) => {
    const fullArticle = await utils.client.getNews.query({ slug: article.slug });
    if (!fullArticle) {
      alert("Could not load this article.");
      return;
    }

    setEditingId(article.id);
    setTitle(fullArticle.title);
    setDate(fullArticle.date);
    setCoverImage(fullArticle.coverImage ?? "");
    setContent(fullArticle.content);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this article? This cannot be undone.")) {
      return;
    }
    if (editingId === id) {
      resetForm();
    }
    deleter.mutate({ id });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Title and content are required.");
      return;
    }

    const payload = {
      title: title.trim(),
      date,
      coverImage: coverImage.trim(),
      content,
    };

    try {
      if (editingId) {
        await updater.mutateAsync({ id: editingId, ...payload });
      } else {
        await creator.mutateAsync(payload);
      }
    } catch {
      // errors surfaced via onError handlers
    }
  };

  return (
    <AdminLayout>
      <section className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 sm:p-6 text-white">
        <section className="w-full lg:w-1/2 min-w-0">
          <h3 className="text-2xl font-bold mb-2">
            {editingId ? "Edit article" : "Write a new article"}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Content is written in Markdown (headings, images, lists, tables all supported) with a
            live preview below.
          </p>

          <form onSubmit={handleSubmit}>
            <fieldset className="grid gap-6 border p-6 rounded-xl">
              <legend>{editingId ? "Edit news" : "New news"}</legend>

              <div>
                <label htmlFor="newsTitle" className="block text-sm mb-2">
                  Title
                </label>
                <input
                  id="newsTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. City Club lift the cup"
                  className="border py-2 px-4 rounded-xl w-full bg-transparent"
                />
              </div>

              <div>
                <label htmlFor="newsDate" className="block text-sm mb-2">
                  Date
                </label>
                <input
                  id="newsDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border py-2 px-4 rounded-xl w-full bg-transparent [color-scheme:dark]"
                />
              </div>

              <div>
                <label htmlFor="newsImage" className="block text-sm mb-2">
                  Cover image URL
                </label>
                <input
                  id="newsImage"
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="/cup.jpg or https://..."
                  className="border py-2 px-4 rounded-xl w-full bg-transparent"
                />
                {coverImage.trim() && (
                  <img
                    src={coverImage.trim()}
                    alt="Cover preview"
                    className="mt-3 h-28 w-full object-cover rounded-xl"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>

              <div>
                <label htmlFor="newsContent" className="block text-sm mb-2">
                  Content (Markdown)
                </label>
                <textarea
                  id="newsContent"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder={"# Heading\n\nWrite your story here..."}
                  className="border py-2 px-4 rounded-xl w-full bg-transparent font-mono text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingId ? "Update article" : "Publish article"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </section>

        <section className="w-full lg:w-1/2 min-w-0">
          <h3 className="text-2xl font-bold mb-6">All articles</h3>

          {isLoading ? (
            <p className="text-slate-400">Loading articles...</p>
          ) : articles.length === 0 ? (
            <p className="text-slate-400">No articles yet.</p>
          ) : (
            <ul className="grid gap-4">
              {articles.map((article) => (
                <li
                  key={article.id}
                  className="flex flex-col sm:flex-row gap-4 bg-[#333] rounded-xl p-4"
                >
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt=""
                      className="w-full sm:w-20 h-20 object-cover rounded-lg shrink-0"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="hidden sm:flex w-20 h-20 bg-[#262626] rounded-lg items-center justify-center shrink-0">
                      <span className="text-slate-500 text-xs">No img</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400">{formatDate(article.date)}</p>
                    <h4 className="font-semibold truncate">{article.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-2 mt-1">{article.excerpt}</p>

                    <div className="flex flex-wrap gap-3 mt-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleEdit(article)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(article.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg"
                      >
                        Delete
                      </button>
                      <a
                        href={`/news/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {(title || content) && (
            <div className="mt-8">
              <h4 className="text-sm uppercase tracking-wide text-slate-400 mb-3">Live preview</h4>
              <article className="bg-white text-black rounded-xl p-6 prose max-w-none">
                {title && <h1>{title}</h1>}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </article>
            </div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
}
