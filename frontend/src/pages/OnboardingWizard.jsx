import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import { initialsForProfile } from "../lib/profile";

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ displayName: "", bio: "" });
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOnboarding();
  }, []);

  async function loadOnboarding() {
    setLoading(true);
    try {
      const [me, tagData, feedData] = await Promise.all([
        api.currentUser(),
        api.getTrendingTags(),
        api.getTrendingPosts({ page: 0, size: 8 })
      ]);
      setProfile({ displayName: me.displayName || me.username || "", bio: me.bio || "" });
      setTags(tagData || []);
      const authors = [];
      (feedData.content || []).forEach((post) => {
        if (post.authorUsername && !authors.some((author) => author.username === post.authorUsername)) {
          authors.push({
            username: post.authorUsername,
            displayName: post.authorDisplayName
          });
        }
      });
      setSuggested(authors.slice(0, 4));
    } catch (err) {
      setError(extractApiError(err, "Failed to load onboarding."));
    } finally {
      setLoading(false);
    }
  }

  const canContinue = useMemo(() => {
    if (step === 0) return profile.displayName.trim().length > 0;
    if (step === 1) return selected.length >= 3;
    return true;
  }, [profile.displayName, selected.length, step]);

  function toggleTag(name) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((tag) => tag !== name)
        : current.length >= 5
          ? current
          : [...current, name]
    );
  }

  async function saveAndContinue() {
    setSaving(true);
    setError("");
    try {
      if (step === 0) {
        await api.updateProfile(profile);
        setStep(1);
      } else if (step === 1) {
        await api.saveInterests(selected);
        await loadSuggestedWriters(selected);
        setStep(2);
      } else {
        navigate("/feed");
      }
    } catch (err) {
      setError(extractApiError(err, "Failed to save onboarding."));
    } finally {
      setSaving(false);
    }
  }

  async function follow(username) {
    setSaving(true);
    try {
      await api.followUser(username);
      setSuggested((current) => current.filter((author) => author.username !== username));
    } catch (err) {
      setError(extractApiError(err, "Failed to follow writer."));
    } finally {
      setSaving(false);
    }
  }

  async function loadSuggestedWriters(interests) {
    const normalized = interests.slice(0, 5);
    const settled = await Promise.allSettled(
      normalized.map((tag) => api.searchPosts("", { tags: tag, sort: "trending", page: 0, size: 5 }))
    );
    const authors = [];
    settled.forEach((result) => {
      if (result.status !== "fulfilled") return;
      (result.value.content || []).forEach((post) => {
        if (post.authorUsername && !authors.some((author) => author.username === post.authorUsername)) {
          authors.push({
            username: post.authorUsername,
            displayName: post.authorDisplayName
          });
        }
      });
    });

    if (authors.length > 0) {
      setSuggested(authors.slice(0, 4));
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper-narrow" style={{ paddingTop: "2rem" }}>
        <Loader label="Loading welcome..." />
      </div>
    );
  }

  return (
    <div className="page-wrapper-narrow">
      <div className="editor-page">
        <div className="editor-header">
          <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>Welcome</h1>
          <p className="text-muted">Set up enough context for a useful feed.</p>
        </div>

        <div className="feed-tabs">
          {["Profile", "Interests", "Writers"].map((label, index) => (
            <button key={label} type="button" className={`feed-tab${step === index ? " active" : ""}`} disabled>
              {label}
            </button>
          ))}
        </div>
      </div>

      {step === 0 ? (
        <div>
          <div className="form-field">
            <label className="form-label">Display name</label>
            <input className="form-input"
              value={profile.displayName}
              onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
              maxLength={255}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Short bio</label>
            <textarea className="form-textarea"
              rows={4}
              value={profile.bio}
              onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
              maxLength={500}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div>
          <p className="form-hint" style={{ marginBottom: "1rem" }}>Choose 3 to 5 interests.</p>
          <div className="tag-row">
            {tags.slice(0, 16).map((tag) => (
              <button
                className={`tag${selected.includes(tag.name) ? " active" : ""}`}
                key={tag.id || tag.slug}
                type="button"
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          {suggested.length === 0 ? <p className="empty">No writer suggestions yet.</p> : null}
          {suggested.map((author) => (
            <div className="dashboard-post-row" key={author.username}>
              <div className="dashboard-post-body" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="avatar avatar-sm">{initialsForProfile(author)}</div>
                <div>
                  <div className="dashboard-post-title">{author.displayName || author.username}</div>
                  <div className="dashboard-post-meta">@{author.username}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" type="button" disabled={saving} onClick={() => follow(author.username)}>
                Follow
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="btn-row" style={{ marginTop: "1.5rem" }}>
        {step === 2 ? (
          <button className="btn btn-ghost" type="button" onClick={() => navigate("/feed")}>
            Skip
          </button>
        ) : null}
        <button className="btn btn-primary" type="button" disabled={!canContinue || saving} onClick={saveAndContinue}>
          {step === 2 ? "Finish" : "Continue"}
        </button>
      </div>
    </div>
  );
}
