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
  const { refreshUser, logout } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState("");

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

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordError("");
    setPasswordFeedback("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      setChangingPassword(false);
      return;
    }

    try {
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordFeedback("Password changed. Please sign in again.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => logout(), 800);
    } catch (err) {
      setPasswordError(extractApiError(err, "Failed to change password."));
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <div className="page-wrapper-narrow"><Loader label="Loading profile…" /></div>;

  return (
    <div className="page-wrapper-narrow">
      <div style={{ paddingTop: "2rem" }}>
        <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>Edit profile</h1>
        <p className="text-muted" style={{ marginBottom: "2rem" }}>Update how you appear to readers.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Display name</label>
            <input className="form-input" value={form.displayName} maxLength={80}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" rows={3} value={form.bio} maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell readers about yourself…" />
          </div>
          <div className="form-field">
            <label className="form-label">Website</label>
            <input className="form-input" value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://yoursite.com" />
          </div>
          <div className="form-field">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="City, Country" />
          </div>

          {error && <p className="form-error">{error}</p>}
          {feedback && <p className="form-success">{feedback}</p>}

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
          <h2 className="section-heading" style={{ fontSize: "1.1rem" }}>Password</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-field">
              <label className="form-label">Current password</label>
              <input className="form-input" type="password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">New password</label>
              <input className="form-input" type="password" minLength={8} value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Confirm new password</label>
              <input className="form-input" type="password" minLength={8} value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
            </div>

            {passwordError && <p className="form-error">{passwordError}</p>}
            {passwordFeedback && <p className="form-success">{passwordFeedback}</p>}

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                {changingPassword ? "Changing…" : "Change password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
