import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = cookies();

  const names = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ];

  for (const name of names) {
    if (cookieStore.get(name)) {
      cookieStore.set(name, "", { expires: new Date(0), path: "/" });
    }
  }

  // fallback: clear any cookie that starts with next-auth
  for (const entry of cookieStore.getAll()) {
    if (entry.name.startsWith("next-auth")) {
      cookieStore.set(entry.name, "", { expires: new Date(0), path: "/" });
    }
  }

  const url = new URL(req.url);
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

