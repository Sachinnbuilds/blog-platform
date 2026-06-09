import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";

export default function TagFeedPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState("latest");
  const [meta, setMeta] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPosts();
  }, [slug, sort, page]);

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getTagPosts(slug, {
        sort,
        page,
        size: 8
      });
      setPosts(data.content || []);
      setMeta({
        number: data.number ?? 0,
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0
      });
    } catch (err) {
      setError(extractApiError(err, "Failed to load tag feed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="tag-page-header">
        <h1 className="tag-page-name">#{slug}</h1>
        <p className="tag-page-count">{meta.totalElements} stories</p>
        <div className="feed-tabs" style={{ marginTop: "1rem", marginBottom: 0 }}>
          {["latest", "trending"].map((s) => (
            <button key={s} className={`feed-tab${sort === s ? " active" : ""}`}
              onClick={() => { setSort(s); setPage(0); }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? <Loader /> : posts.length === 0 ? (
        <p className="empty">No stories for this tag yet.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}

      {meta.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>← Previous</button>
          <span className="pagination-info">Page {meta.number + 1} of {meta.totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= meta.totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
