import { useState } from "react";
import { Link, Outlet, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { api } from "../lib/api";

export default function Layout() {
  const { workspaceId } = useParams();
  const { user, logout } = useAuth();
  const { workspaces, tags } = useWorkspaces(workspaceId);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = workspaces.find((w) => w.id === workspaceId);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const ws = await api("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    setShowCreate(false);
    navigate(`/workspace/${ws.id}`);
    window.location.reload();
  }

  const SidebarContent = () => (
    <>
      <div className="border-b p-4">
        <h2 className="truncate font-semibold">{active?.name || "Workspace"}</h2>
        <p className="truncate text-xs text-gray-500">{user?.email}</p>
      </div>

      {workspaceId && (
        <nav className="flex flex-col gap-1 p-3">
          <Link
            to={`/workspace/${workspaceId}`}
            onClick={() => setSidebarOpen(false)}
            className="rounded px-3 py-2 text-sm hover:bg-gray-100"
          >
            Resource Board
          </Link>
          <Link
            to={`/workspace/${workspaceId}/members`}
            onClick={() => setSidebarOpen(false)}
            className="rounded px-3 py-2 text-sm hover:bg-gray-100"
          >
            Member Management
          </Link>
        </nav>
      )}

      {tags.length > 0 && (
        <div className="mt-4 px-4">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Tags</p>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={logout}
        className="mt-auto border-t p-4 text-left text-sm text-red-500 hover:bg-gray-50"
      >
        Logout
      </button>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md border text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-semibold truncate">{active?.name || "Workspace"}</span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Workspace icon strip */}
        <div className="flex items-center gap-2 border-b bg-gray-900 px-3 py-3 overflow-x-auto">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/workspace/${ws.id}`}
              title={ws.name}
              onClick={() => setSidebarOpen(false)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                ws.id === workspaceId ? "bg-indigo-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {ws.name.charAt(0).toUpperCase()}
            </Link>
          ))}
          <button
            onClick={() => { setShowCreate(!showCreate); setSidebarOpen(false); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xl text-white hover:bg-gray-600"
            title="Create workspace"
          >
            +
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop: icon sidebar */}
      <aside className="hidden md:flex w-16 flex-col items-center gap-3 bg-gray-900 py-4">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            to={`/workspace/${ws.id}`}
            title={ws.name}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
              ws.id === workspaceId ? "bg-indigo-500" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {ws.name.charAt(0).toUpperCase()}
          </Link>
        ))}
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-xl text-white hover:bg-gray-600"
          title="Create workspace"
        >
          +
        </button>
      </aside>

      {/* Desktop: text sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-white">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {showCreate && (
          <div className="border-b bg-indigo-50 p-4">
            <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workspace name"
                className="flex-1 min-w-0 rounded border px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}