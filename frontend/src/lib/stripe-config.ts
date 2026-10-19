import "server-only";
import { requireRuntimeEnv } from "@/lib/runtime-config";

/** A production deployment must never create sandbox payments. Local/preview testing stays available. */
export function requireStripeSecretKey(): string {
  const secret = requireRuntimeEnv("STRIPE_SECRET_KEY");
  if (process.env.VERCEL_ENV === "production") {
    const publishable = requireRuntimeEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    if (!secret.startsWith("sk_live_") || !publishable.startsWith("pk_live_")) {
      throw new Error("Production Stripe requires matching live-mode configuration");
    }
  }
  return secret;
}
