import { useEffect, useState } from "react";
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

const AUTOSAVE_KEY = "blog-platform-create-draft";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTOSAVE_KEY)) || initialForm;
    } catch {
      return initialForm;
    }
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
  }, [form]);

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
        tags,
        status,
        thumbnail: form.thumbnail || undefined
      });
      localStorage.removeItem(AUTOSAVE_KEY);
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
    <div className="page-wrapper-narrow">
      <div className="editor-page">
        <div className="editor-header">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>New story</h1>
          <p className="text-muted">Write, tag, and publish or save as draft.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} maxLength={180}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Give your story a title…" />
          </div>
          <div className="form-field">
            <label className="form-label">Summary <span className="text-muted" style={{ fontWeight: 400 }}>(shown in feeds)</span></label>
            <textarea className="form-textarea" rows={2} value={form.summary} maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="A short preview of this story…" />
          </div>
          <div className="form-field">
            <label className="form-label">Tags</label>
            <input className="form-input" value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="react, writing, design" />
            <p className="form-hint">Comma-separated. Up to 5 tags.</p>
          </div>
          <div className="form-field">
            <label className="form-label">Content</label>
            <textarea className="form-textarea" rows={18} value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Tell your story…" style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: "1.8" }} />
          </div>

          <ImageUpload value={form.thumbnail} onChange={(thumbnail) => setForm((f) => ({ ...f, thumbnail }))} />

          {error && <p className="form-error">{error}</p>}

          <div className="editor-toolbar">
            <button type="button" className="btn btn-ghost" onClick={() => setPreviewOpen((open) => !open)}>
              {previewOpen ? "Hide preview" : "Preview"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { localStorage.removeItem(AUTOSAVE_KEY); setForm(initialForm); }}>Reset</button>
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => savePost("DRAFT")}>
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>

        {previewOpen && (
          <article className="editor-preview">
            <h2>{form.title || "Untitled story"}</h2>
            {form.summary && <p className="editor-preview-summary">{form.summary}</p>}
            <div className="post-body">{form.content || "Nothing written yet."}</div>
          </article>
        )}
      </div>
    </div>
  );
}
