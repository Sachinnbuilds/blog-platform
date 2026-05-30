export default function Loader({ label = "Loading..." }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className="loader-ring" />
      <span className="helper-text">{label}</span>
    </div>
  );
}
