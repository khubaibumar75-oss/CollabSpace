import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { setTokenFromOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      setTokenFromOAuth(token).then(() => navigate("/onboarding"));
    } else {
      navigate("/login?error=oauth_failed");
    }
  }, [params, setTokenFromOAuth, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Completing sign in...</p>
    </div>
  );
}
