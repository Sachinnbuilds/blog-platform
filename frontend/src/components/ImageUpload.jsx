import { useState } from "react";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
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
      event.target.value = "";
    }
  }

  return (
    <div className="image-upload-card">
      <div className="field">
        <span className="field-label">Thumbnail image</span>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      </div>

      {value ? (
        <div className="image-preview">
          <img src={value} alt="Uploaded preview" />
        </div>
      ) : (
        <p className="helper-text">Upload an image or leave this empty.</p>
      )}

      {uploading ? <p className="helper-text">Uploading image...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
