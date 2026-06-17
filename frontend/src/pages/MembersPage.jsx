import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useWorkspaces } from "../hooks/useWorkspaces";

export default function MembersPage() {
  const { workspaceId } = useParams();
  const { workspaces } = useWorkspaces();

  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [message, setMessage] = useState("");

  // ✅ ADDED LOADING STATE
  const [loading, setLoading] = useState(false);

  const currentRole = workspaces.find((w) => w.id === workspaceId)?.role;
  const isAdmin = currentRole === "ADMIN";

  function loadMembers() {
    if (!workspaceId) return;

    api(`/workspaces/${workspaceId}/members`)
      .then((data) => setMembers(data.members))
      .catch(() => setMembers([]));
  }

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  // ✅ FIXED INVITE (PREVENT DOUBLE CLICK)
  async function handleInvite(e) {
    e.preventDefault();

    if (loading) return; // 🚫 block duplicate requests

    setLoading(true);
    setMessage("");

    try {
      const res = await api(`/workspaces/${workspaceId}/invite`, {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      setMessage(res.message);
      setInviteEmail("");
      setInviteRole("MEMBER");

      loadMembers();
    } catch (err) {
      setMessage(err.message || "Invite failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId) {
    if (!confirm("Remove this member?")) return;

    await api(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });

    loadMembers();
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-6 text-xl font-bold">Members</h1>

      {/* Invite form */}
      {isAdmin && (
        <div className="mb-6 rounded border bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Invite a colleague
          </p>

          <form
            onSubmit={handleInvite}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full rounded border px-3 py-2 text-sm sm:flex-1"
            />

            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded border px-3 py-2 text-sm"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>

            {/* ✅ FIXED BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 sm:w-auto disabled:opacity-50"
            >
              {loading ? "Inviting..." : "Invite"}
            </button>
          </form>
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-600">
          {message}
        </p>
      )}

      {/* Members table */}
      <div className="overflow-x-auto rounded border bg-white shadow-sm">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              {isAdmin && (
                <th className="px-4 py-3 font-medium">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {members.map((m) => (
              <tr key={m.userId} className="border-b last:border-0">
                <td className="px-4 py-3 text-gray-800">{m.email}</td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      m.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.role}
                  </span>
                </td>

                {isAdmin && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemove(m.userId)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {members.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 3 : 2}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}