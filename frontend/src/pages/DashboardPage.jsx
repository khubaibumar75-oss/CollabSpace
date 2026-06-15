import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

export default function DashboardPage() {
  const { workspaceId } = useParams();
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  function loadResources() {
    if (!workspaceId) return;
    api(`/workspaces/${workspaceId}/resources`)
      .then((data) => setResources(data.resources))
      .catch(() => setResources([]));
  }

  useEffect(() => {
    loadResources();
  }, [workspaceId]);

  async function handleAdd(e) {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await api(`/workspaces/${workspaceId}/resources`, {
      method: "POST",
      body: JSON.stringify({ title, url, tags }),
    });

    setTitle("");
    setUrl("");
    setTagsInput("");
    setShowForm(false);
    loadResources();
  }

  const filtered = resources.filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !activeTag || r.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(resources.flatMap((r) => r.tags))];

  return (
    <div className="p-4 sm:p-6">
      {/* Search + Add */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className="w-full rounded border px-3 py-2 text-sm sm:flex-1"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 sm:w-auto"
        >
          {showForm ? "Cancel" : "Add Resource"}
        </button>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded px-3 py-1 text-xs ${
              !activeTag ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`rounded px-3 py-1 text-xs ${
                activeTag === tag ? "bg-indigo-600 text-white" : "bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Add resource form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 rounded border bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              type="url"
              required
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Tags (comma separated)"
              className="rounded border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="mt-3 w-full rounded bg-indigo-600 px-4 py-2 text-sm text-white sm:w-auto"
          >
            Save
          </button>
        </form>
      )}

      {/* Resource grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-gray-400">No resources yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-1 truncate text-xs text-gray-400">{r.url}</p>
              {r.user && (
                <p className="mt-1 text-xs text-gray-400">by {r.user.email}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {r.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}