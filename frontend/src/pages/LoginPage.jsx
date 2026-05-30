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
    <article className="panel auth-panel">
      <div className="panel-header">
        <h3>Login</h3>
        <p>JWT login wired through Auth Context and Axios interceptors.</p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Username</span>
          <input
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="writer01"
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="••••••••"
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button className="action-button primary" type="submit" disabled={authLoading}>
          {authLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="helper-text">
        Need an account? <Link to="/register">Create one here</Link>.
      </p>
    </article>
  );
}
