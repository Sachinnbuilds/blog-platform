export default function PlaceholderPage({ title, description }) {
  return (
    <div className="page-wrapper-narrow">
      <div style={{ paddingTop: "2rem" }}>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
      <p className="text-muted">This route is available where needed.</p>
    </div>
  );
}
