import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageUpload from "../components/ImageUpload";
import Loader from "../components/Loader";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";

const initialForm = {
  id: "",
  title: "",
  summary: "",
  content: "",
  tags: "",
  status: "PUBLISHED",
  thumbnail: ""
};

export default function EditPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEditorData();
  }, [slug]);

  async function loadEditorData() {
    setLoading(true);
    setError("");

    try {
      const postData = await api.getEditablePostBySlug(slug);

      setPost(postData);
      setForm({
        id: postData.id,
        title: postData.title || "",
        summary: postData.summary || "",
        content: postData.content || "",
        tags: (postData.tags || []).map((tag) => tag.name).join(", "),
        status: postData.status || "PUBLISHED",
        thumbnail: postData.thumbnail || ""
      });
    } catch (err) {
      setError(extractApiError(err, "Failed to load post editor."));
    } finally {
      setLoading(false);
    }
  }

  const canEdit = isAdmin || user?.username === post?.authorUsername;

  async function handleSubmit(event) {
    event.preventDefault();
    await savePost(form.status || "PUBLISHED");
  }

  async function savePost(status) {
    setSaving(true);
    setError("");

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5);

      const updated = await api.updatePost(form.id, {
        title: form.title,
        summary: form.summary || undefined,
        content: form.content,
        tags,
        status,
        thumbnail: form.thumbnail || undefined
      });
      navigate(status === "DRAFT" ? "/dashboard" : `/posts/${updated.slug}`);
    } catch (err) {
      setError(extractApiError(err, "Failed to update post."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this post? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await api.deletePost(form.id);
      navigate("/dashboard");
    } catch (err) {
      setError(extractApiError(err, "Failed to delete post."));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="page-wrapper-narrow"><Loader label="Loading editor…" /></div>;

  if (error && !post) return (
    <div className="page-wrapper-narrow" style={{ paddingTop: "2rem" }}>
      <p className="form-error">{error}</p>
    </div>
  );

  return (
    <div className="page-wrapper-narrow">
      <div className="editor-page">
        <div className="editor-header">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Edit story</h1>
          <p className="text-muted">
            {post?.status === "DRAFT" ? "Draft" : "Published"}
            {post?.status !== "DRAFT" && (
              <>
                {" · "}
                <Link to={`/posts/${post?.slug}`} className="link-underline">View live</Link>
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} maxLength={180}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Summary</label>
            <textarea className="form-textarea" rows={2} value={form.summary} maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Tags</label>
            <input className="form-input" value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            <p className="form-hint">Comma-separated. Up to 5 tags.</p>
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Content</label>
            <textarea className="form-textarea" rows={18} value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: "1.8" }} />
          </div>

          <ImageUpload value={form.thumbnail} onChange={(thumbnail) => setForm((f) => ({ ...f, thumbnail }))} />

          {error && <p className="form-error" style={{ marginTop: "0.5rem" }}>{error}</p>}

          <div className="editor-toolbar">
            <button type="submit" className="btn btn-ghost" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {form.status === "DRAFT" && (
              <button type="button" className="btn btn-primary" disabled={saving}
                onClick={() => savePost("PUBLISHED")}>
                {saving ? "Publishing…" : "Publish"}
              </button>
            )}
            {canEdit && (
              <button type="button" className="btn btn-danger" disabled={deleting}
                onClick={() => { if (window.confirm("Delete this post? This cannot be undone.")) handleDelete(); }}>
                {deleting ? "Deleting…" : "Delete story"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
