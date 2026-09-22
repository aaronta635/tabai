import { redirect } from "next/navigation";

export default function QueueRedirect() {
  redirect("/teacher/submissions");
}
