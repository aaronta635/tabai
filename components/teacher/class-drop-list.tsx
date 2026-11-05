"use client";

import { useRouter } from "next/navigation";
import { assignWork } from "@/app/teacher/lms-actions";
import { ClassDropZone } from "@/components/teacher/curriculum-board";

export function ClassDropList({ classes }: { classes: { id: string; name: string }[] }) {
  const router = useRouter();
  if (classes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {classes.map((row) => (
        <ClassDropZone
          key={row.id}
          classId={row.id}
          name={row.name}
          onAssigned={async (input) => {
            const result = await assignWork(input);
            if (result && "error" in result) return result;
            router.refresh();
            return result;
          }}
        />
      ))}
    </div>
  );
}
