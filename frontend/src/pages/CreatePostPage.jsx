import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "../components/ImageUpload";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";

const initialForm = {
  title: "",
  summary: "",
  content: "",
  tags: "",
  thumbnail: ""
};

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function savePost(status) {
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5);

    setSaving(true);
    setError("");

    try {
      const created = await api.createPost({
        title: form.title,
        summary: form.summary || undefined,
        content: form.content,
        tags: tags.join(","),
        status,
        thumbnail: form.thumbnail || undefined
      });
      navigate(status === "DRAFT" ? "/dashboard" : `/posts/${created.slug}`);
    } catch (err) {
      setError(extractApiError(err, "Failed to save post."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await savePost("PUBLISHED");
  }

  return (
    <article className="panel editor-panel">
      <div className="panel-header">
        <h3>Create Post</h3>
        <p>Write with tags, summary, image upload, and draft or publish status.</p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Title</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Write a clear title"
            maxLength={180}
          />
        </label>

        <label className="field">
          <span className="field-label">Summary</span>
          <textarea
            rows={3}
            value={form.summary}
            onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            placeholder="Short preview for feeds and search"
            maxLength={500}
          />
        </label>

        <label className="field">
          <span className="field-label">Tags</span>
          <input
            value={form.tags}
            onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
            placeholder="react, writing, backend"
          />
          <span className="helper-text">Use commas. Up to 5 tags are sent.</span>
        </label>

        <label className="field">
          <span className="field-label">Content</span>
          <textarea
            rows={12}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            placeholder="Write the article body"
          />
        </label>

        <ImageUpload
          value={form.thumbnail}
          onChange={(thumbnail) => setForm((current) => ({ ...current, thumbnail }))}
        />

        {form.thumbnail ? (
          <label className="field">
            <span className="field-label">Thumbnail URL</span>
            <input value={form.thumbnail} readOnly />
          </label>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}

        <div className="button-row">
          <button className="action-button ghost" type="button" onClick={() => setForm(initialForm)}>
            Reset
          </button>
          <button
            className="action-button ghost"
            type="button"
            disabled={saving}
            onClick={() => savePost("DRAFT")}
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <button className="action-button primary" type="submit" disabled={saving}>
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </form>
    </article>
  );
}
