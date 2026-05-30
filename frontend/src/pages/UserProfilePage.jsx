import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { formatAbsoluteDate } from "../lib/format";
import { extractApiError } from "../lib/http";
import { initialsForProfile, normalizeWebsite } from "../lib/profile";

export default function UserProfilePage() {
  const { username } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, [username, isAuthenticated]);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const [profileData, postData] = await Promise.all([
        api.getUserProfile(username),
        api.getUserPosts(username, { page: 0, size: 8 })
      ]);
      setProfile(profileData);
      setPosts(postData.content || []);
      if (isAuthenticated && user?.username !== username) {
        const status = await api.isFollowing(username);
        setIsFollowing(Boolean(status.isFollowing));
      }
    } catch (err) {
      setError(extractApiError(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow() {
    setActionLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowUser(username);
      } else {
        await api.followUser(username);
      }
      setIsFollowing((current) => !current);
      await loadProfile();
    } catch (err) {
      setError(extractApiError(err, "Failed to update follow status."));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <article className="panel route-detail-card">
        <Loader label="Loading profile..." />
      </article>
    );
  }

  if (error || !profile) {
    return (
      <article className="panel route-detail-card">
        <p className="error-text">{error || "Profile not found."}</p>
      </article>
    );
  }

  const ownProfile = user?.username === profile.username;

  return (
    <div className="content-grid route-grid route-grid-wide">
      <article className="panel">
        <div className="profile-header">
          <div className="avatar-circle">{initialsForProfile(profile)}</div>
          <div>
            <h3>{profile.displayName || profile.username}</h3>
            <p className="helper-text">@{profile.username}</p>
          </div>
        </div>

        {profile.bio ? <p className="detail-body">{profile.bio}</p> : null}

        <div className="story-meta">
          {profile.location ? <span>{profile.location}</span> : null}
          {profile.website ? (
            <a href={normalizeWebsite(profile.website)} target="_blank" rel="noreferrer">
              {profile.website}
            </a>
          ) : null}
          {profile.joinedAt ? <span title={formatAbsoluteDate(profile.joinedAt)}>Joined {profile.joinedAt}</span> : null}
        </div>

        <div className="stats-grid author-stats-grid">
          <Link className="stat-card post-card-link" to={`/u/${profile.username}/followers`}>
            <span>Followers</span>
            <strong>{profile.followerCount}</strong>
          </Link>
          <Link className="stat-card post-card-link" to={`/u/${profile.username}/following`}>
            <span>Following</span>
            <strong>{profile.followingCount}</strong>
          </Link>
        </div>

        <div className="button-row">
          {ownProfile ? (
            <Link className="action-button primary" to="/settings/profile">
              Edit profile
            </Link>
          ) : isAuthenticated ? (
            <button className="action-button primary" type="button" disabled={actionLoading} onClick={toggleFollow}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          ) : (
            <Link className="action-button primary" to="/login">
              Login to follow
            </Link>
          )}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Published Stories</h3>
          <p>{posts.length} visible stories.</p>
        </div>
        {posts.length === 0 ? (
          <p className="empty-state">No published stories yet.</p>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} compact />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
