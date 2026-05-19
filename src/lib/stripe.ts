import Stripe from 'stripe';

let stripeClient: Stripe;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    stripeClient = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
  }
  return stripeClient;
}

export const PRICES = {
  standard: { amount: 599, label: 'Standard Brief' },
  deep:     { amount: 1199, label: 'Deep Brief' },
} as const;
