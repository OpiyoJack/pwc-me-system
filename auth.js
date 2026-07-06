import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verify as verifyOtp } from "otplib";
import { prisma } from "./lib/prisma";
import { logActivity } from "./lib/activity-log";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        token: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        const token = credentials?.token;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!user.active) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        if (user.mfaEnabled) {
          if (!token) {
            throw new Error("MFA_REQUIRED");
          }
          const result = await verifyOtp({ secret: user.mfaSecret, token: String(token).trim() });
          if (!result.valid) {
            throw new Error("Invalid authentication code.");
          }
        }

        await logActivity(user.name, "Login", `Logged in as ${user.email}`, user.email);

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions || "",
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.permissions = user.permissions;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.permissions = token.permissions;
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
});
