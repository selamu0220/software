import Stripe from "stripe";
import { storage } from "./storage";

// Check for Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe payments won't work.");
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy-key", {
  apiVersion: "2025-03-31.basil",
});

export const MONTHLY_PRICE_EUR = 499; // €4.99 in cents
export const LIFETIME_PRICE_EUR = 2999; // €29.99 in cents

/**
 * Creates a checkout session for monthly subscription
 */
export async function createMonthlySubscription(userId: number, email: string, username: string) {
  try {
    // First check if user already has a subscription
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // If user already has a subscription, retrieve it
    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null,
      };
    }
    
    // Create a new customer if needed
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: username,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
      await storage.updateStripeCustomerId(userId, customerId);
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'TubeIdeaGen Monthly Subscription',
              description: 'Monthly subscription to TubeIdeaGen Premium',
            },
            unit_amount: MONTHLY_PRICE_EUR,
            recurring: {
              interval: 'month',
            },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user with subscription info
    await storage.updateUserStripeInfo(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    
    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

/**
 * Creates a checkout session for lifetime access
 */
export async function createLifetimePayment(userId: number, email: string, username: string) {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create a customer if needed
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: username,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
      await storage.updateStripeCustomerId(userId, customerId);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: LIFETIME_PRICE_EUR,
      currency: 'eur',
      customer: customerId,
      metadata: {
        userId: userId.toString(),
        paymentType: 'lifetime',
      },
      description: 'TubeIdeaGen Lifetime Access',
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating lifetime payment:", error);
    throw error;
  }
}

/**
 * Handle webhook events from Stripe
 */
export async function handleWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = parseInt(paymentIntent.metadata.userId);
        
        if (paymentIntent.metadata.paymentType === 'lifetime') {
          await storage.updateUserPremiumStatus(userId, true, true);
        }
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = parseInt(subscription.metadata.userId || '0');
          await storage.updateUserPremiumStatus(userId, true, false);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata.userId || '0');
        if (userId) {
          // Only update if the user doesn't have lifetime access
          const user = await storage.getUser(userId);
          if (user && !user.lifetimeAccess) {
            await storage.updateUserPremiumStatus(userId, false, false);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}
