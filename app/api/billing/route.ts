import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

// Create a new subscription
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { guardianId, amount, frequency, description, startDate } = body;

    // Get guardian's payment method from Firestore
    const guardianRef = adminDb.collection('guardians').doc(guardianId);
    const guardianDoc = await guardianRef.get();
    
    if (!guardianDoc.exists) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
    }

    const guardianData = guardianDoc.data();
    const customerId = guardianData?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: "No payment method found" }, { status: 400 });
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price_data: {
          currency: 'usd',
          product: 'prod_Q000000000000', // Replace with your actual product ID
          unit_amount: Math.round(amount * 100), // Convert to cents
          recurring: {
            interval: frequency,
          },
        },
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in Firestore
    const subscriptionData = {
      guardianId,
      stripeSubscriptionId: subscription.id,
      amount,
      frequency,
      description,
      startDate: new Date(startDate),
      status: subscription.status,
      createdAt: new Date(),
    };

    const subscriptionRef = await adminDb.collection('subscriptions').add(subscriptionData);

    return NextResponse.json({
      subscriptionId: subscriptionRef.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get all subscriptions for a guardian
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const guardianId = searchParams.get("guardianId");

    if (!guardianId) {
      return NextResponse.json({ error: "Guardian ID is required" }, { status: 400 });
    }

    const subscriptionsSnapshot = await adminDb
      .collection('subscriptions')
      .where('guardianId', '==', guardianId)
      .get();

    const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(subscriptions);
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update subscription status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { subscriptionId, status } = body;

    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const subscriptionData = subscriptionDoc.data();
    
    // Update Stripe subscription
    await stripe.subscriptions.update(subscriptionData?.stripeSubscriptionId!, {
      cancel_at_period_end: status === "cancelled",
    });

    // Update Firestore
    await subscriptionRef.update({
      status,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 