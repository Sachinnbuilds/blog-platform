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
        tags: tags.join(","),
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

  if (loading) {
    return (
      <article className="panel route-detail-card">
        <Loader label="Loading editor..." />
      </article>
    );
  }

  if (!post) {
    return (
      <article className="panel route-detail-card">
        <p className="error-text">{error || "Post not found."}</p>
      </article>
    );
  }

  if (!canEdit) {
    return (
      <article className="panel route-detail-card">
        <div className="panel-header">
          <h3>Edit Post</h3>
          <p>You do not have permission to edit this post.</p>
        </div>
        <Link className="action-button ghost detail-back-link" to={`/posts/${post.slug}`}>
          Back to post
        </Link>
      </article>
    );
  }

  return (
    <article className="panel editor-panel">
      <div className="panel-header">
        <h3>Edit Post</h3>
        <p>Only the author or an admin can update this post.</p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Title</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            maxLength={180}
          />
        </label>

        <label className="field">
          <span className="field-label">Summary</span>
          <textarea
            rows={3}
            value={form.summary}
            onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
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
          <span className="field-label">Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Content</span>
          <textarea
            rows={12}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
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
          <button className="action-button ghost" type="button" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete post"}
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
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </article>
  );
}
