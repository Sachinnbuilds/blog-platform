import { Link } from "react-router-dom";
import { formatTimeAgo } from "../lib/format";

export default function PostCard({ post, featured = false }) {
  const preview = post.summary || post.content || "";
  const author = post.authorDisplayName || post.authorUsername || post.author?.displayName || post.author?.username || "Unknown";
  const firstTag = post.tags?.[0]?.name;

  return (
    <Link to={`/posts/${post.slug}`} className={`post-card${featured ? " post-card-featured" : ""}`}>
      {post.thumbnail && (
        <div className="post-card-thumb">
          <img src={post.thumbnail} alt={post.title} />
        </div>
      )}
      <div className="post-card-body">
        <div className="post-card-meta">
          <span className="post-card-author">{author}</span>
          {firstTag && <><span className="post-card-dot" /><span>{firstTag}</span></>}
        </div>
        <div className="post-card-title">{post.title}</div>
        {preview && <div className="post-card-summary">{preview}</div>}
        <div className="post-card-footer">
          <span>{formatTimeAgo(post.createdAt)}</span>
          {post.readTime && <><span className="post-card-dot" /><span>{post.readTime}</span></>}
          {post.likes > 0 && <><span className="post-card-dot" /><span>{post.likes} likes</span></>}
        </div>
      </div>
    </Link>
  );
}
