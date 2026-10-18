import { headers } from "next/headers";
import { isLocalhostOrigin, resolveAppOrigin } from "@/lib/app-origin";

export { originFromRequest, PRODUCTION_APP_ORIGIN, resolveAppOrigin } from "@/lib/app-origin";

export async function appOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ?? (host && isLocalhostOrigin(`http://${host}`) ? "http" : "https");
  const fromHeaders = host ? `${proto}://${host.split(",")[0]!.trim()}` : "";
  return resolveAppOrigin(fromHeaders);
}
