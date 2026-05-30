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
      <article className="panel route-detail-card">
        <Loader label="Loading welcome..." />
      </article>
    );
  }

  return (
    <article className="panel route-detail-card">
      <div className="panel-header">
        <h3>Welcome</h3>
        <p>Set up enough context for a useful feed.</p>
      </div>

      {step === 0 ? (
        <div className="form-stack">
          <label className="field">
            <span className="field-label">Display name</span>
            <input
              value={profile.displayName}
              onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
              maxLength={255}
            />
          </label>
          <label className="field">
            <span className="field-label">Short bio</span>
            <textarea
              rows={4}
              value={profile.bio}
              onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
              maxLength={500}
            />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="form-stack">
          <p className="helper-text">Choose 3 to 5 interests.</p>
          <div className="tag-row">
            {tags.slice(0, 16).map((tag) => (
              <button
                className={`tab-chip ${selected.includes(tag.name) ? "active" : ""}`}
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
        <div className="stack-list">
          {suggested.length === 0 ? <p className="empty-state">No writer suggestions yet.</p> : null}
          {suggested.map((author) => (
            <div className="list-row list-row-wide" key={author.username}>
              <div className="profile-header compact-profile-header">
                <div className="avatar-circle small">{initialsForProfile(author)}</div>
                <div>
                  <strong>{author.displayName || author.username}</strong>
                  <p>@{author.username}</p>
                </div>
              </div>
              <button className="action-button ghost" type="button" disabled={saving} onClick={() => follow(author.username)}>
                Follow
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}

      <div className="button-row">
        {step === 2 ? (
          <button className="action-button ghost" type="button" onClick={() => navigate("/feed")}>
            Skip
          </button>
        ) : null}
        <button className="action-button primary" type="button" disabled={!canContinue || saving} onClick={saveAndContinue}>
          {step === 2 ? "Finish" : "Continue"}
        </button>
      </div>
    </article>
  );
}
