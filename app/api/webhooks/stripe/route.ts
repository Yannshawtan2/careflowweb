import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature")!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  // Record successful payment in Firestore
  const paymentData = {
    subscriptionId: invoice.subscription,
    amount: invoice.amount_paid / 100, // Convert from cents
    status: "completed",
    invoiceId: invoice.id,
    paymentDate: new Date(),
  };

  await adminDb.collection('payments').add(paymentData);

  // Update subscription status if needed
  const subscriptionSnapshot = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', invoice.subscription)
    .get();
  
  if (!subscriptionSnapshot.empty) {
    const subscriptionDoc = subscriptionSnapshot.docs[0];
    await subscriptionDoc.ref.update({
      status: "active",
      lastPaymentDate: new Date(),
    });
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  // Record failed payment in Firestore
  const paymentData = {
    subscriptionId: invoice.subscription,
    amount: invoice.amount_due / 100,
    status: "failed",
    invoiceId: invoice.id,
    failureReason: invoice.last_payment_error?.message || "Unknown error",
    paymentDate: new Date(),
  };

  await adminDb.collection('payments').add(paymentData);

  // Update subscription status
  const subscriptionSnapshot = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', invoice.subscription)
    .get();
  
  if (!subscriptionSnapshot.empty) {
    const subscriptionDoc = subscriptionSnapshot.docs[0];
    await subscriptionDoc.ref.update({
      status: "past_due",
      lastPaymentAttempt: new Date(),
    });
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const subscriptionSnapshot = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscription.id)
    .get();
  
  if (!subscriptionSnapshot.empty) {
    const subscriptionDoc = subscriptionSnapshot.docs[0];
    await subscriptionDoc.ref.update({
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    });
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const subscriptionSnapshot = await adminDb
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscription.id)
    .get();
  
  if (!subscriptionSnapshot.empty) {
    const subscriptionDoc = subscriptionSnapshot.docs[0];
    await subscriptionDoc.ref.update({
      status: "cancelled",
      cancelledAt: new Date(),
    });
  }
} 