import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { StaffRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Identifiants RyHaD",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          assignableAsTechnician: user.assignableAsTechnician,
          phone: user.phone,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.assignableAsTechnician = (user as any).assignableAsTechnician;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as StaffRole;
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).assignableAsTechnician = token.assignableAsTechnician as boolean;
        (session.user as any).phone = token.phone as string | null;
      }
      return session;
    },
  },
});

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  assignableAsTechnician: boolean;
  phone?: string | null;
}

export async function getCurrentUser(): Promise<SessionUser> {
  const session = await auth();

  if (session?.user?.id) {
    try {
      const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          assignableAsTechnician: true,
          phone: true,
        },
      });

      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          assignableAsTechnician: dbUser.assignableAsTechnician,
          phone: dbUser.phone,
        };
      }
    } catch (e) {
      console.error("Error reading session user from db:", e);
    }
  }

  // Fallback invité (sera intercepté par middleware / redirect)
  return {
    id: "",
    email: "",
    firstName: "Utilisateur",
    lastName: "",
    role: StaffRole.RECEPTIONNISTE,
    assignableAsTechnician: false,
    phone: null,
  };
}

export function hasPermission(
  role: StaffRole,
  action: "manage_users" | "manage_contracts" | "cash_diag" | "edit_tech_notes"
): boolean {
  switch (action) {
    case "manage_users":
    case "manage_contracts":
      return role === StaffRole.ADMIN;
    case "cash_diag":
      return role === StaffRole.RECEPTIONNISTE || role === StaffRole.ADMIN;
    case "edit_tech_notes":
      return role === StaffRole.TECHNICIEN || role === StaffRole.ADMIN;
    default:
      return false;
  }
}
