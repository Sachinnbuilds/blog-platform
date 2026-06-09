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

  if (loading) return <div className="page-wrapper"><Loader label="Loading profile…" /></div>;
  if (error || !profile) return <div className="page-wrapper"><p className="form-error">{error || "Profile not found."}</p></div>;

  const ownProfile = user?.username === profile.username;

  return (
    <div className="page-wrapper">
      <div className="profile-hero">
        <div className="profile-hero-top">
          <div className="avatar avatar-lg">{initialsForProfile(profile)}</div>
          <div>
            <h1 className="page-title" style={{ fontSize: "1.5rem" }}>{profile.displayName || profile.username}</h1>
            <p className="text-muted">@{profile.username}</p>
          </div>
        </div>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-meta-row">
          {profile.location && <span>{profile.location}</span>}
          {profile.website && <a href={normalizeWebsite(profile.website)} target="_blank" rel="noreferrer">{profile.website}</a>}
          {profile.joinedAt && <span>Joined {profile.joinedAt}</span>}
        </div>

        <div className="profile-stats-row">
          <Link to={`/u/${profile.username}/followers`} className="profile-stat" style={{ textDecoration: "none" }}>
            <span className="profile-stat-num">{profile.followerCount}</span>
            <span className="profile-stat-label">Followers</span>
          </Link>
          <Link to={`/u/${profile.username}/following`} className="profile-stat" style={{ textDecoration: "none", marginLeft: "1.5rem" }}>
            <span className="profile-stat-num">{profile.followingCount}</span>
            <span className="profile-stat-label">Following</span>
          </Link>
        </div>

        <div className="btn-row">
          {ownProfile ? (
            <Link to="/settings/profile" className="btn btn-ghost">Edit profile</Link>
          ) : isAuthenticated ? (
            <button className="btn btn-primary" disabled={actionLoading} onClick={toggleFollow}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary">Follow</Link>
          )}
        </div>
      </div>

      <h2 className="section-heading" style={{ fontSize: "1.1rem" }}>Stories</h2>
      {posts.length === 0 ? (
        <p className="empty">No published stories yet.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
