import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Page not found</h1>
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>This page doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-ghost">Go home</Link>
    </div>
  );
}
