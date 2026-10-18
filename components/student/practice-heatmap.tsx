export function PracticeHeatmap({
  days,
  label,
}: {
  days: { day: string; count: number }[];
  label: string;
}) {
  const max = Math.max(1, ...days.map((day) => day.count));
  return (
    <div>
      <p className="mb-2 text-sm text-ink-soft">{label}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const opacity = day.count === 0 ? 0.12 : 0.25 + (day.count / max) * 0.75;
          return (
            <div
              key={day.day}
              title={`${day.day}: ${day.count}`}
              className="h-7 rounded-md bg-beat"
              style={{ opacity }}
            />
          );
        })}
      </div>
    </div>
  );
}
