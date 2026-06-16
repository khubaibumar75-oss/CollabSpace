import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate("/onboarding");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold">CollabSpace</h1>
        <p className="mb-6 text-sm text-gray-500">
          {isSignup ? "Create your account" : "Sign in to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded border px-3 py-2"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "..." : isSignup ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex gap-2">
          <a
           href={`${import.meta.env.VITE_API_URL}/api/oauth/google`}
            className="flex-1 rounded border py-2 text-center text-sm hover:bg-gray-50"
          >
            Google
          </a>
          <a
            href={`${import.meta.env.VITE_API_URL}/api/oauth/github`}
            className="flex-1 rounded border py-2 text-center text-sm hover:bg-gray-50"
          >
            GitHub
          </a>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isSignup ? "Already have an account?" : "No account yet?"}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-indigo-600 hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
