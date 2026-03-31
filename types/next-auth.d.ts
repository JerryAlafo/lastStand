import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      username:  string;
      createdAt: string;
      userId:    string;
      ip:        string;
      userAgent: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?:  string;
    createdAt?: string;
    userId?:    string;
    ip?:        string;
    userAgent?: string;
  }
}
