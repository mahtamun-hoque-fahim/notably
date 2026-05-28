"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, isDbConfigured } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { getStripe, isBillingConfigured, PRO_PRICE_ID } from "@/lib/stripe";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function currentUser() {
  if (!isDbConfigured()) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export type BillingResult =
  | { ok: true; url: string }
  | { ok: false; error: "auth" | "unconfigured" | "failed" };

// Start a Stripe Checkout session for the Pro subscription.
export async function startCheckoutAction(): Promise<BillingResult> {
  if (!isBillingConfigured()) return { ok: false, error: "unconfigured" };
  const u = await currentUser();
  if (!u) return { ok: false, error: "auth" };

  try {
    const stripe = getStripe();

    // Reuse an existing Stripe customer, or create one tied to the user.
    let customerId = (u as { stripeCustomerId?: string | null }).stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: u.email,
        name: u.name,
        metadata: { userId: u.id },
      });
      customerId = customer.id;
      await db
        .update(userTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(userTable.id, u.id));
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${appUrl()}/app?upgraded=1`,
      cancel_url: `${appUrl()}/app`,
      allow_promotion_codes: true,
      // Tie the subscription back to our user for webhook reconciliation.
      subscription_data: { metadata: { userId: u.id } },
      metadata: { userId: u.id },
    });

    if (!checkout.url) return { ok: false, error: "failed" };
    return { ok: true, url: checkout.url };
  } catch {
    return { ok: false, error: "failed" };
  }
}

// Open the Stripe customer portal to manage / cancel the subscription.
export async function openPortalAction(): Promise<BillingResult> {
  if (!isBillingConfigured()) return { ok: false, error: "unconfigured" };
  const u = await currentUser();
  if (!u) return { ok: false, error: "auth" };

  const customerId = (u as { stripeCustomerId?: string | null }).stripeCustomerId ?? null;
  if (!customerId) return { ok: false, error: "failed" };

  try {
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl()}/app`,
    });
    return { ok: true, url: portal.url };
  } catch {
    return { ok: false, error: "failed" };
  }
}
