import { Link } from "react-router-dom";
import { formatAbsoluteDate, formatTimeAgo } from "../lib/format";

export default function PostCard({ post, compact = false }) {
  const primaryTag = post.tags?.[0]?.name || "Story";
  const preview = post.summary || post.content;

  return (
    <Link
      to={`/posts/${post.slug}`}
      className={`post-card-link ${compact ? "compact" : ""}`}
    >
      <article className={`post-card-public ${compact ? "compact" : ""}`}>
        {post.thumbnail ? (
          <div className="post-card-thumb">
            <img src={post.thumbnail} alt={post.title} />
          </div>
        ) : null}

        <div className="post-card-copy">
          <span className="mini-tag">{primaryTag}</span>
          <h4>{post.title}</h4>
          <p>{preview}</p>
          <div className="story-meta">
            <span>{post.author?.displayName || post.author?.username || post.authorDisplayName || "Unknown author"}</span>
            <span title={formatAbsoluteDate(post.createdAt)}>{formatTimeAgo(post.createdAt)}</span>
            {post.readTime ? <span>{post.readTime}</span> : null}
            <span>{post.likes || 0} likes</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
