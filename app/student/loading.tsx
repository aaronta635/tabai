/** Paints on click so the student side never looks frozen while Postgres answers. */
export default function StudentLoading() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="skeleton h-9 w-56" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="skeleton h-40" />
    </div>
  );
}
