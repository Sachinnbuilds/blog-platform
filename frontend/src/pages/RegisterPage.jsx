import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, authLoading } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const result = await register(form);
      setMessage(typeof result === "string" ? result : "Registration successful.");
      window.setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join and start writing</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Username</label>
            <input className="form-input" value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="yourname" autoComplete="username" />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="At least 6 characters" autoComplete="new-password" />
          </div>
          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={authLoading}
            style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
            {authLoading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-muted" style={{ marginTop: "1.5rem", textAlign: "center" }}>
          Already registered? <Link to="/login" className="link-underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
