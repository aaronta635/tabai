/** Paints the moment a nav item is clicked, so the studio never looks frozen while Postgres answers. */
export default function StudioLoading() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="skeleton h-9 w-52" />
      <div className="skeleton h-9 w-36 rounded-full" />
      <div className="tile-grid">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
    </div>
  );
}
