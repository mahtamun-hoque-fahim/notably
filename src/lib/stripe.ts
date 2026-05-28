import Stripe from "stripe";

// Lazy singleton — only instantiated when a billing route actually runs, so the
// app builds and runs in guest/free mode without STRIPE_SECRET_KEY present.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    // No apiVersion override — use the version pinned by the installed SDK.
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
