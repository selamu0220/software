import { loadStripe } from "@stripe/stripe-js";

// Ensure the Stripe public key is available
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey && import.meta.env.DEV) {
  console.warn("VITE_STRIPE_PUBLIC_KEY is not set. Stripe functionality will not work.");
}

// Initialize Stripe outside of any component render cycle
let stripePromise: ReturnType<typeof loadStripe> | null = null;

/**
 * Gets the Stripe instance, creating it if necessary
 */
export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

/**
 * Subscription plan details
 */
export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: "Monthly Premium",
    price: 1000, // €10.00 in cents
    priceDisplay: "€10",
    interval: "month",
    description: "Everything you need for serious YouTube growth."
  },
  lifetime: {
    name: "Lifetime Access",
    price: 7000, // €70.00 in cents
    priceDisplay: "€70",
    interval: "one-time",
    description: "Pay once, access forever."
  }
};

/**
 * Creates a monthly subscription for the user
 */
export async function createMonthlySubscription() {
  const response = await fetch("/api/subscriptions/monthly", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create subscription: ${errorText}`);
  }

  return await response.json();
}

/**
 * Creates a lifetime payment for the user
 */
export async function createLifetimePayment() {
  const response = await fetch("/api/subscriptions/lifetime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create payment: ${errorText}`);
  }

  return await response.json();
}
