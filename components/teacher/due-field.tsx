"use client";

export function DueField({
  assignmentId,
  label,
  action,
}: {
  assignmentId: string;
  label: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input
        type="date"
        name="dueAt"
        required
        aria-label={label}
        className="field"
        onChange={(event) => {
          if (event.currentTarget.value) event.currentTarget.form?.requestSubmit();
        }}
      />
    </form>
  );
}
