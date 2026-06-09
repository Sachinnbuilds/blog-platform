import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import { initialsForProfile } from "../lib/profile";

export default function FollowListPage({ type }) {
  const { username } = useParams();
  const [people, setPeople] = useState([]);
  const [meta, setMeta] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPeople();
  }, [username, type, page]);

  async function loadPeople() {
    setLoading(true);
    setError("");
    try {
      const data = type === "followers"
        ? await api.getFollowers(username, { page, size: 20 })
        : await api.getFollowing(username, { page, size: 20 });
      setPeople(data.content || []);
      setMeta({
        number: data.number ?? 0,
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0
      });
    } catch (err) {
      setError(extractApiError(err, "Failed to load people."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper-narrow">
      <div style={{ paddingTop: "2rem" }}>
        <h1 className="page-title">{type === "followers" ? "Followers" : "Following"}</h1>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>{meta.totalElements} people for @{username}.</p>
      </div>

      {loading ? (
        <Loader label="Loading people..." />
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : people.length === 0 ? (
        <p className="empty">No people found.</p>
      ) : (
        <div>
          {people.map((person) => (
            <Link className="dashboard-post-row" key={person.id || person.username} to={`/u/${person.username}`}>
              <div className="dashboard-post-body" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="avatar avatar-sm">{initialsForProfile(person)}</div>
                <div>
                  <div className="dashboard-post-title">{person.displayName || person.username}</div>
                  <div className="dashboard-post-meta">@{person.username}</div>
                </div>
              </div>
              <span className="text-muted">{person.followerCount || 0} followers</span>
            </Link>
          ))}
        </div>
      )}

      <div className="pagination">
        <button className="btn btn-ghost btn-sm" type="button" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(value - 1, 0))}>
          Previous
        </button>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          disabled={loading || meta.totalPages === 0 || page >= meta.totalPages - 1}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
