import { initialsOf } from "@/lib/initials";

export function AvatarMark({ name, src, large = false }: { name: string; src?: string | null; large?: boolean }) {
  if (src) {
    return <img src={src} alt="" className={large ? "avatar-photo avatar-photo-lg" : "avatar-photo"} />;
  }
  return (
    <span className={`avatar-btn font-ui${large ? " avatar-btn-lg" : ""}`} aria-hidden>
      {initialsOf(name)}
    </span>
  );
}
