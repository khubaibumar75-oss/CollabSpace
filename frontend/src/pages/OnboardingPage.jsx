import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function OnboardingPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api("/workspaces")
      .then((data) => {
        setWorkspaces(data.workspaces);
        if (data.workspaces.length > 0) {
          navigate(`/workspace/${data.workspaces[0].id}`, { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const ws = await api("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      navigate(`/workspace/${ws.id}`);
    } catch {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (workspaces.length > 0) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold">Welcome to CollabSpace</h1>
        <p className="mb-6 text-sm text-gray-500">
          Create your first workspace to get started.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name (e.g. Design Team)"
            required
            className="w-full rounded border px-3 py-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
