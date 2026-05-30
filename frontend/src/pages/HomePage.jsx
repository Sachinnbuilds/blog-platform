import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import { useAuth } from "../contexts/AuthContext";
import { initialsForProfile } from "../lib/profile";

const initialQuery = { keyword: "", tag: "", tab: "trending", page: 0, size: 6 };

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, number: 0 });
  const [feedback, setFeedback] = useState("Loading feed...");
  const [loading, setLoading] = useState(false);
  const [followingWriter, setFollowingWriter] = useState("");

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    const tag = searchParams.get("tag") || "";
    if (tag) {
      setQuery((current) => ({ ...current, tag, page: 0 }));
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPosts();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [query.keyword, query.tag, query.tab, query.page, query.size, user]);

  async function loadTags() {
    try {
      const data = await api.getTrendingTags();
      setTags(data);
    } catch (error) {
      setFeedback(extractApiError(error, "Failed to load tags."));
    }
  }

  async function loadPosts() {
    setLoading(true);
    try {
      let data;
      if (query.keyword) {
        data = await api.searchPosts(query.keyword, {
          tags: query.tag || undefined,
          sort: query.tab === "trending" ? "trending" : "latest",
          page: query.page,
          size: query.size
        });
      } else if (query.tag) {
        data = await api.getPostsByTag(query.tag, {
          page: query.page,
          size: query.size
        });
      } else if (query.tab === "following" || query.tab === "for_you") {
        data = user
          ? await api.getFeed({ type: query.tab, page: query.page, size: query.size })
          : await api.getTrendingPosts({ page: query.page, size: query.size });
      } else if (query.tab === "trending") {
        data = await api.getTrendingPosts({ page: query.page, size: query.size });
      } else {
        data = await api.getPosts({ page: query.page, size: query.size });
      }

      setPosts(data.content || []);
      setMeta({
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
        number: data.number ?? 0
      });
      setFeedback(`${data.totalElements ?? data.content?.length ?? 0} stories available.`);
    } catch (error) {
      setFeedback(extractApiError(error, "Failed to load posts."));
      setPosts([]);
      setMeta({ totalElements: 0, totalPages: 0, number: 0 });
    } finally {
      setLoading(false);
    }
  }

  const featuredPost = posts[0];
  const suggestedWriters = uniqueAuthors(posts, user?.username).slice(0, 5);
  const personalizedTabLocked = !user && (query.tab === "following" || query.tab === "for_you");

  async function followWriter(username) {
    setFollowingWriter(username);
    try {
      await api.followUser(username);
      setFeedback(`Following @${username}.`);
    } catch (error) {
      setFeedback(extractApiError(error, "Failed to follow writer."));
    } finally {
      setFollowingWriter("");
    }
  }

  return (
    <div className="content-grid feed-layout">
      <section className="feed-main">
        <article className="panel route-hero-panel">
          <div className="panel-header">
            <h3>Feed</h3>
            <p>Trending, latest, following, and interest-based discovery.</p>
          </div>

          <div className="button-row">
            {["trending", "latest", "following", "for_you"].map((tab) => (
              <button
                key={tab}
                className={`action-button ${query.tab === tab ? "primary" : "ghost"}`}
                type="button"
                disabled={!user && (tab === "following" || tab === "for_you")}
                onClick={() => setQuery((current) => ({ ...current, tab, tag: "", page: 0 }))}
              >
                {tab === "for_you" ? "For You" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {!user ? (
            <div className="feed-auth-note">
              <span className="mini-tag">Member feeds</span>
              <p>Following and For You unlock after login and onboarding. Public discovery stays available here.</p>
              <Link className="action-button ghost" to="/login">Login</Link>
            </div>
          ) : null}

          <div className="field-row">
            <label className="field">
              <span className="field-label">Search</span>
              <input
                value={query.keyword}
                onChange={(event) =>
                  setQuery((current) => ({ ...current, keyword: event.target.value, page: 0 }))
                }
                placeholder="Search by keyword"
              />
            </label>

            <label className="field">
              <span className="field-label">Tag</span>
              <select
                value={query.tag}
                onChange={(event) =>
                  setQuery((current) => ({ ...current, tag: event.target.value, page: 0 }))
                }
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag.id || tag.slug} value={tag.slug}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="button-row">
            <button className="action-button ghost" onClick={() => setQuery(initialQuery)}>
              Clear filters
            </button>
            <span className="helper-text">{personalizedTabLocked ? "Login to use this personalized feed." : feedback}</span>
          </div>

          {featuredPost ? (
            <Link className="feature-story-link" to={`/posts/${featuredPost.slug}`}>
              <div className="feature-story-block">
                <div className="feature-story-copy">
                  <span className="mini-tag">{featuredPost.tags?.[0]?.name || "Story"}</span>
                  <h4>{featuredPost.title}</h4>
                  <p>
                    {(featuredPost.summary || featuredPost.content || "").slice(0, 220)}
                    {(featuredPost.summary || featuredPost.content || "").length > 220 ? "..." : ""}
                  </p>
                </div>
                {featuredPost.thumbnail ? (
                  <div className="feature-story-thumb">
                    <img src={featuredPost.thumbnail} alt={featuredPost.title} />
                  </div>
                ) : null}
              </div>
            </Link>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Stories</h3>
            <p>
              Result count: {meta.totalElements} | Page {meta.number + 1} of{" "}
              {Math.max(meta.totalPages, 1)}
            </p>
          </div>

          {loading ? (
            <Loader label="Loading stories..." />
          ) : posts.length === 0 ? (
            <p className="empty-state">No posts matched the current feed filters.</p>
          ) : (
            <div className="post-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          )}

          <div className="button-row">
            <button
              className="action-button ghost"
              onClick={() =>
                setQuery((current) => ({ ...current, page: Math.max(current.page - 1, 0) }))
              }
              disabled={query.page === 0 || loading}
            >
              Previous
            </button>
            <button
              className="action-button primary"
              onClick={() =>
                setQuery((current) => ({
                  ...current,
                  page: current.page + 1
                }))
              }
              disabled={loading || meta.totalPages === 0 || query.page >= meta.totalPages - 1}
            >
              Next
            </button>
          </div>
        </article>
      </section>

      <aside className="feed-sidebar">
        <article className="panel sidebar-panel">
          <div className="panel-header">
            <h3>Trending Tags</h3>
            <p>Open topics ranked by activity.</p>
          </div>
          <div className="tag-row">
            {tags.slice(0, 14).map((tag) => (
              <Link className="mini-tag tag-link" key={tag.id || tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`}>
                {tag.name}
              </Link>
            ))}
          </div>
        </article>

        <article className="panel sidebar-panel">
          <div className="panel-header">
            <h3>Writers</h3>
            <p>Authors active in this feed.</p>
          </div>
          {suggestedWriters.length === 0 ? (
            <p className="empty-state">Writer suggestions appear as stories load.</p>
          ) : (
            <div className="stack-list">
              {suggestedWriters.map((writer) => (
                <div className="writer-row" key={writer.username}>
                  <Link className="writer-profile-link" to={`/u/${writer.username}`}>
                    <div className="avatar-circle small">{initialsForProfile(writer)}</div>
                    <div>
                      <strong>{writer.displayName || writer.username}</strong>
                      <p>@{writer.username}</p>
                    </div>
                  </Link>
                  {user ? (
                    <button
                      className="action-button ghost writer-follow-button"
                      type="button"
                      disabled={followingWriter === writer.username}
                      onClick={() => followWriter(writer.username)}
                    >
                      {followingWriter === writer.username ? "..." : "Follow"}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </aside>
    </div>
  );
}

function uniqueAuthors(posts, currentUsername) {
  const authors = new Map();
  posts.forEach((post) => {
    const username = post.authorUsername || post.author?.username;
    if (!username || username === currentUsername || authors.has(username)) {
      return;
    }
    authors.set(username, {
      username,
      displayName: post.authorDisplayName || post.author?.displayName || username
    });
  });
  return Array.from(authors.values());
}
