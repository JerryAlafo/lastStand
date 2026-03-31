import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const username = session?.user?.username;
  if (username) return redirect("/game");
  return redirect("/login");
}

