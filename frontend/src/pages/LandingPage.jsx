import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { initialsForProfile } from "../lib/profile";

export default function LandingPage() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [stats, setStats] = useState(null);
  const writers = uniqueAuthors(posts).slice(0, 4);

  useEffect(() => {
    Promise.allSettled([
      api.getTrendingPosts({ page: 0, size: 6 }),
      api.getTrendingTags(),
      api.getPlatformStats()
    ]).then(([postData, tagData, statsData]) => {
      if (postData.status === "fulfilled") setPosts(postData.value.content || []);
      if (tagData.status === "fulfilled") setTags(tagData.value || []);
      if (statsData.status === "fulfilled") setStats(statsData.value);
    });
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div>
      {/* Hero */}
      <div className="landing-hero">
        <p className="landing-hero-eyebrow">Independent publishing</p>
        <h1 className="landing-hero-title">Stories worth <em>reading</em>.</h1>
        <p className="landing-hero-sub">
          A home for essays, ideas, and technical writing from independent authors.
        </p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <Link to="/register" className="btn btn-primary">Start writing</Link>
          <Link to="/feed" className="btn btn-ghost">Explore stories</Link>
        </div>
        {stats && (
          <div className="landing-stats">
            <div><span className="landing-stat-num">{stats.totalUsers}</span><span className="landing-stat-label">writers</span></div>
            <div><span className="landing-stat-num">{stats.totalPosts}</span><span className="landing-stat-label">stories</span></div>
            <div><span className="landing-stat-num">{stats.totalTags}</span><span className="landing-stat-label">topics</span></div>
          </div>
        )}
      </div>

      <div className="page-wrapper">
        <div className="landing-grid">
          {/* Left — stories */}
          <div>
            <p className="landing-featured-label">Trending stories</p>
            {featured && <PostCard post={featured} featured />}
            <div style={{ marginTop: "1.5rem" }}>
              {rest.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Link to="/feed" className="btn btn-ghost">See all stories</Link>
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            {tags.length > 0 && (
              <div className="sidebar-section">
                <div className="sidebar-heading">Popular topics</div>
                <div className="tag-row">
                  {tags.slice(0, 10).map((tag) => (
                    <Link key={tag.id || tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`} className="tag tag-link">
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {writers.length > 0 && (
              <div className="sidebar-section">
                <div className="sidebar-heading">Writers to follow</div>
                {writers.map((w) => (
                  <Link key={w.username} to={`/u/${w.username}`} className="sidebar-writer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                    <div className="avatar avatar-sm">{initialsForProfile(w)}</div>
                    <div>
                      <div className="sidebar-writer-name">{w.displayName || w.username}</div>
                      <div className="sidebar-writer-handle">@{w.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function uniqueAuthors(posts) {
  const seen = new Map();
  posts.forEach((p) => {
    const username = p.authorUsername || p.author?.username;
    if (username && !seen.has(username)) seen.set(username, { username, displayName: p.authorDisplayName || p.author?.displayName || username });
  });
  return Array.from(seen.values());
}
