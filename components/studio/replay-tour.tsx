"use client";

import { openStudioTour } from "@/components/studio/studio-tour";

export function ReplayTour({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-quiet" onClick={openStudioTour}>
      {label}
    </button>
  );
}
