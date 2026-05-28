import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";

// Stripe signature verification needs the raw, unparsed body.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function setPlanByCustomer(customerId: string, plan: "free" | "pro", subId?: string | null) {
  await db
    .update(userTable)
    .set({ plan, stripeSubscriptionId: subId ?? null, updatedAt: new Date() })
    .where(eq(userTable.stripeCustomerId, customerId));
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "billing not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (customerId) await setPlanByCustomer(customerId, "pro", subId);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        // active/trialing → pro; anything else (canceled, unpaid, paused) → free.
        const active = sub.status === "active" || sub.status === "trialing";
        await setPlanByCustomer(customerId, active ? "pro" : "free", active ? sub.id : null);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await setPlanByCustomer(customerId, "free", null);
        break;
      }
      default:
        break;
    }
  } catch {
    // Returning 500 makes Stripe retry, which is the desired behavior on a
    // transient DB error.
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
