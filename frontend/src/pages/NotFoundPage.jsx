import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <article className="panel not-found-card">
      <span className="mini-tag">404</span>
      <h3>That page was not found.</h3>
      <p>The route exists in the rebuild plan, but this URL does not match any current page.</p>
      <Link className="action-button primary not-found-link" to="/">
        Back to home
      </Link>
    </article>
  );
}
