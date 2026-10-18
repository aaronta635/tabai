import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";

export default function StudentTokenPage() {
  redirect(signInPath("student", "/student/takes"));
}
