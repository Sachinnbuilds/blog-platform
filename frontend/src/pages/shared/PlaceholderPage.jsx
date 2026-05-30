export default function PlaceholderPage({ title, description }) {
  return (
    <article className="panel route-detail-card">
      <div className="panel-header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <p className="helper-text">This route is now real and protected where needed.</p>
    </article>
  );
}
