import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";
import { readUsersLines } from "./fileStore";

type AuthorizedUser = {
  id: string;       // next-auth requires this field
  userId: string;   // our own UUID
  username: string;
  createdAt: string;
  ip: string;
  userAgent: string;
};

function parseUserLine(line: string) {
  const parts = line.split("|");
  const [username, hashedPassword, createdAt] = parts;
  if (!username || !hashedPassword || !createdAt) return null;
  return {
    username,
    hashedPassword,
    createdAt,
    userId:    parts[3] ?? "",
    ip:        parts[4] ?? "",
    userAgent: parts[5] ?? "",
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.toString().trim();
        const password = credentials?.password?.toString();
        if (!username || !password) return null;

        const lines = await readUsersLines();
        const match = lines
          .map(parseUserLine)
          .find((u): u is NonNullable<ReturnType<typeof parseUserLine>> => !!u && u.username === username);
        if (!match) return null;

        const ok = await bcrypt.compare(password, match.hashedPassword);
        if (!ok) return null;

        const user: AuthorizedUser = {
          id:          match.userId || match.username,
          userId:      match.userId,
          username:    match.username,
          createdAt:   match.createdAt,
          ip:          match.ip,
          userAgent:   match.userAgent,
        };
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AuthorizedUser;
        token.username  = u.username;
        token.createdAt = u.createdAt;
        token.userId    = u.userId;
        token.ip        = u.ip;
        token.userAgent = u.userAgent;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.username && token.createdAt) {
        session.user = {
          username:  token.username,
          createdAt: token.createdAt,
          userId:    (token.userId as string) ?? "",
          ip:        (token.ip as string) ?? "",
          userAgent: (token.userAgent as string) ?? "",
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

