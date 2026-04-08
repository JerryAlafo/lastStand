import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createServiceClient } from "@/lib/supabase";

const authOptions: NextAuthOptions = {
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

        const supabase = createServiceClient();

        // Get user by username from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (!profile) return null;

        // Get legacy user to verify password
        const bcrypt = require("bcryptjs");
        const { data: legacyUser } = await supabase
          .from("users_legacy")
          .select("hashed_password")
          .eq("username", username)
          .single();

        if (legacyUser) {
          const isValid = await bcrypt.compare(password, legacyUser.hashed_password);
          if (!isValid) return null;
        }

        const user = {
          id: profile.id,
          userId: profile.id,
          username: profile.username,
          createdAt: profile.created_at,
          ip: profile.ip || "",
          userAgent: profile.user_agent || "",
        };

        return user as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.username  = u.username;
        token.createdAt = u.createdAt;
        token.userId    = u.userId || u.id;
        token.ip        = u.ip;
        token.userAgent = u.userAgent;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.username && token.createdAt) {
        (session.user as any) = {
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
