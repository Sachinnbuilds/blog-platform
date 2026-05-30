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
    <div className="content-grid route-grid route-grid-wide">
      <article className="panel route-hero-panel">
        <div className="panel-header">
          <h3>#{slug}</h3>
          <p>{meta.totalElements} stories tagged with this topic.</p>
        </div>

        <div className="button-row">
          {["latest", "trending"].map((value) => (
            <button
              key={value}
              className={`action-button ${sort === value ? "primary" : "ghost"}`}
              type="button"
              onClick={() => {
                setSort(value);
                setPage(0);
              }}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
          <Link className="action-button ghost" to="/feed">
            Back to feed
          </Link>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Stories</h3>
          <p>
            Page {meta.number + 1} of {Math.max(meta.totalPages, 1)}
          </p>
        </div>

        {loading ? (
          <Loader label="Loading tag stories..." />
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : posts.length === 0 ? (
          <p className="empty-state">No stories found for this tag.</p>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} compact />
            ))}
          </div>
        )}

        <div className="button-row">
          <button className="action-button ghost" type="button" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(value - 1, 0))}>
            Previous
          </button>
          <button
            className="action-button primary"
            type="button"
            disabled={loading || meta.totalPages === 0 || page >= meta.totalPages - 1}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </article>
    </div>
  );
}
