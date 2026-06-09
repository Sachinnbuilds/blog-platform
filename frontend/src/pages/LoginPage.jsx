import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authLoading } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(form);
      const target = location.state?.from?.pathname || "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Username</label>
            <input className="form-input" value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="yourname" autoComplete="username" />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={authLoading}
            style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
            {authLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-muted" style={{ marginTop: "1.5rem", textAlign: "center" }}>
          No account? <Link to="/register" className="link-underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
