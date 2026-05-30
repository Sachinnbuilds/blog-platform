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
    <article className="panel auth-panel">
      <div className="panel-header">
        <h3>Register</h3>
        <p>Account creation now lives in the shared routed auth flow.</p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Username</span>
          <input
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="newwriter"
          />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="writer@example.com"
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="At least 6 characters"
          />
        </label>

        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <button className="action-button primary" type="submit" disabled={authLoading}>
          {authLoading ? "Creating..." : "Create account"}
        </button>
      </form>

      <p className="helper-text">
        Already registered? <Link to="/login">Go to login</Link>.
      </p>
    </article>
  );
}
