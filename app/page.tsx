import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

export default function RootRedirect() {
  // Pick locale from cookie (last user preference) or Accept-Language; default ar.
  const cookieLang = cookies().get("lang")?.value;
  let locale: "ar" | "en" = "ar";
  if (cookieLang === "en" || cookieLang === "ar") {
    locale = cookieLang;
  } else {
    const al = headers().get("accept-language") || "";
    if (al.toLowerCase().startsWith("en")) locale = "en";
  }
  redirect(`/${locale}`);
}
