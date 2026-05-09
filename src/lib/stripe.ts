import Stripe from 'stripe';

let stripeClient: Stripe;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return stripeClient;
}

export const PRICES = {
  standard: { amount: 299, label: 'Standard Brief' },
  deep:     { amount: 599, label: 'Deep Brief' },
} as const;
