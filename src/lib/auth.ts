import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  // Email + password is enough for the MVP. OAuth providers can be added
  // later via socialProviders using GitHub/Google env credentials.
  emailAndPassword: {
    enabled: true,
    // No email service wired yet — skip the verification gate for now.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false, // not settable by the client at sign-up
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // role is granted server-side only, never by the client
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export type Session = typeof auth.$Infer.Session;
