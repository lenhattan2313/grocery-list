import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { config } from "@/config";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Credentials({
      name: "Demo Account",
      credentials: {},
      async authorize() {
        const demoUser = await prisma.user.upsert({
          where: { email: "demo@example.com" },
          update: {},
          create: {
            email: "demo@example.com",
            name: "Demo User",
          },
        });

        return demoUser;
      },
    }),
    Google({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
    jwt: ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
});
