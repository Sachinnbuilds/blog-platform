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
    loadLandingData();
  }, []);

  async function loadLandingData() {
    const [postData, tagData, statsData] = await Promise.allSettled([
      api.getTrendingPosts({ page: 0, size: 3 }),
      api.getTrendingTags(),
      api.getPlatformStats()
    ]);

    if (postData.status === "fulfilled") setPosts(postData.value.content || []);
    if (tagData.status === "fulfilled") setTags(tagData.value || []);
    if (statsData.status === "fulfilled") setStats(statsData.value);
  }

  return (
    <div className="content-grid landing-layout">
      <article className="panel route-hero-panel landing-hero-panel">
        <div className="panel-header">
          <h3>Read, write, discover</h3>
          <p>A publishing space for stories, technical notes, essays, and ideas from independent writers.</p>
        </div>

        <div className="button-row">
          <Link className="action-button primary" to="/create">
            Start Writing
          </Link>
          <Link className="action-button ghost" to="/feed">
            Explore
          </Link>
        </div>

        {stats ? (
          <div className="stats-grid">
            <span>{stats.totalUsers} writers</span>
            <span>{stats.totalPosts} stories</span>
            <span>{stats.totalTags} tags</span>
          </div>
        ) : null}
      </article>

      <article className="panel landing-feature-panel">
        <div className="panel-header">
          <h3>Trending Stories</h3>
          <p>Popular writing across the platform.</p>
        </div>
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Trending Tags</h3>
          <p>Open topics ranked by activity.</p>
        </div>
        <div className="tag-row">
          {tags.slice(0, 12).map((tag) => (
            <Link className="mini-tag tag-link" key={tag.id || tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`}>
              {tag.name}
            </Link>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Featured Writers</h3>
          <p>Voices currently shaping discovery.</p>
        </div>
        {writers.length === 0 ? (
          <p className="empty-state">Featured writers appear as stories are published.</p>
        ) : (
          <div className="featured-writer-grid">
            {writers.map((writer) => (
              <Link className="featured-writer-card" key={writer.username} to={`/u/${writer.username}`}>
                <div className="avatar-circle small">{initialsForProfile(writer)}</div>
                <div>
                  <strong>{writer.displayName || writer.username}</strong>
                  <p>@{writer.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </article>

      <footer className="panel landing-footer">
        <strong>Blog Platform V3</strong>
        <span>Open tags, private drafts, follows, profiles, and search-driven discovery.</span>
        <Link className="detail-back-link" to="/feed">Explore the feed</Link>
      </footer>
    </div>
  );
}

function uniqueAuthors(posts) {
  const authors = new Map();
  posts.forEach((post) => {
    const username = post.authorUsername || post.author?.username;
    if (!username || authors.has(username)) return;
    authors.set(username, {
      username,
      displayName: post.authorDisplayName || post.author?.displayName || username
    });
  });
  return Array.from(authors.values());
}
