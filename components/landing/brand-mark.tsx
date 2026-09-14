export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${light ? "bg-white text-[#141210]" : "bg-[#141210] text-white"}`}
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="8" cy="8" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span className="font-medium tracking-tight">nhận xét</span>
    </span>
  );
}
