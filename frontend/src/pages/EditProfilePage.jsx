import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import { initialsForProfile } from "../lib/profile";

const initialForm = {
  displayName: "",
  bio: "",
  website: "",
  location: ""
};

export default function EditProfilePage() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await api.currentUser();
      setForm({
        displayName: data.displayName || data.username || "",
        bio: data.bio || "",
        website: data.website || "",
        location: data.location || ""
      });
    } catch (err) {
      setError(extractApiError(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await api.updateProfile(form);
      await refreshUser();
      setFeedback("Profile updated.");
    } catch (err) {
      setError(extractApiError(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <article className="panel route-detail-card">
        <Loader label="Loading profile settings..." />
      </article>
    );
  }

  return (
    <div className="content-grid route-grid route-grid-wide">
      <article className="panel">
        <div className="profile-header">
          <div className="avatar-circle">{initialsForProfile(form)}</div>
          <div>
            <h3>Profile Settings</h3>
            <p className="helper-text">V3 uses generated initials avatars.</p>
          </div>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Display name</span>
            <input
              value={form.displayName}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              maxLength={255}
            />
          </label>
          <label className="field">
            <span className="field-label">Bio</span>
            <textarea
              rows={5}
              value={form.bio}
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              maxLength={500}
            />
          </label>
          <label className="field">
            <span className="field-label">Website</span>
            <input
              value={form.website}
              onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              maxLength={512}
            />
          </label>
          <label className="field">
            <span className="field-label">Location</span>
            <input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              maxLength={255}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {feedback ? <p className="success-text">{feedback}</p> : null}

          <div className="button-row">
            <Link className="action-button ghost" to="/dashboard">
              Dashboard
            </Link>
            <button className="action-button primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
