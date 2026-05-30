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
    <article className="panel route-detail-card">
      <div className="panel-header">
        <h3>{type === "followers" ? "Followers" : "Following"}</h3>
        <p>{meta.totalElements} people for @{username}.</p>
      </div>

      {loading ? (
        <Loader label="Loading people..." />
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : people.length === 0 ? (
        <p className="empty-state">No people found.</p>
      ) : (
        <div className="stack-list">
          {people.map((person) => (
            <Link className="list-row list-row-wide post-card-link" key={person.id || person.username} to={`/u/${person.username}`}>
              <div className="profile-header compact-profile-header">
                <div className="avatar-circle small">{initialsForProfile(person)}</div>
                <div>
                  <strong>{person.displayName || person.username}</strong>
                  <p>@{person.username}</p>
                </div>
              </div>
              <span>{person.followerCount || 0} followers</span>
            </Link>
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
  );
}
