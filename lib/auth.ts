import type { NextAuthOptions } from "next-auth";

type AuthorizedUser = {
  id: string;
  userId: string;
  username: string;
  createdAt: string;
  ip: string;
  userAgent: string;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [],
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
          username:  token.username as string,
          createdAt: token.createdAt as string,
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

