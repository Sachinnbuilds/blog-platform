import { useState } from "react";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await api.uploadImage(file);
      onChange(result.url);
    } catch (err) {
      setError(extractApiError(err, "Image upload failed."));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="form-field">
      <label className="form-label">Cover image</label>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p className="form-hint">Uploading…</p>}
      {error && <p className="form-error">{error}</p>}
      {value && (
        <div className="image-preview" style={{ marginTop: "0.75rem" }}>
          <img src={value} alt="Cover preview" />
        </div>
      )}
    </div>
  );
}
