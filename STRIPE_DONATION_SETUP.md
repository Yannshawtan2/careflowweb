# Stripe Donation System Setup Guide

This guide will help you set up the complete Stripe donation integration for your CareFlow application.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Firebase project with Firestore database
3. Next.js application with the required dependencies

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook endpoint secret

# Firebase Configuration (if not already set)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Stripe Setup

### 1. Get Your API Keys

1. Log into your Stripe Dashboard
2. Go to Developers > API keys
3. Copy your Publishable key and Secret key
4. Add them to your environment variables

### 2. Configure Webhooks

1. In Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET`

### 3. Configure Payment Methods

1. In Stripe Dashboard, go to Settings > Payment methods
2. Enable the payment methods you want to accept (credit cards, etc.)
3. Configure your business information

## Firebase Setup

### 1. Firestore Security Rules

Update your Firestore security rules to allow read/write access to campaigns and donations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Campaigns collection
    match /campaigns/{campaignId} {
      allow read: if true; // Anyone can read campaigns
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Donations collection
    match /donations/{donationId} {
      allow read: if true; // Anyone can read donations
      allow write: if true; // Allow webhook to write
    }
  }
}
```

### 2. Database Structure

The system uses the following collections:

**campaigns collection:**
```javascript
{
  id: "string",
  title: "string",
  description: "string",
  goalAmount: number,
  totalRaised: number,
  donationCount: number,
  imageUrl: "string",
  createdAt: "string",
  active: boolean
}
```

**donations collection:**
```javascript
{
  id: "string",
  campaignId: "string",
  amount: number,
  donorEmail: "string",
  donorName: "string",
  message: "string",
  timestamp: "string",
  paymentIntentId: "string",
  status: "pending" | "succeeded" | "failed"
}
```

## Testing

### 1. Test Cards

Use these Stripe test cards for testing:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

### 2. Test the Integration

1. Create a test campaign through the admin dashboard
2. Go to `/donate` page
3. Try making a donation with a test card
4. Check that the webhook updates the campaign totals
5. Verify the donation appears in the history

## Production Deployment

### 1. Switch to Live Keys

1. In Stripe Dashboard, switch to "Live" mode
2. Get your live API keys
3. Update your environment variables
4. Update your webhook endpoint URL to your production domain

### 2. Security Considerations

- Never expose your secret key in client-side code
- Always validate webhook signatures
- Use HTTPS in production
- Implement rate limiting on your API endpoints
- Monitor webhook failures

### 3. Monitoring

Set up monitoring for:
- Failed payments
- Webhook delivery failures
- Campaign performance
- Donation trends

## Features Implemented

✅ **Frontend Payment Form with Stripe Elements**
- Secure payment form with Stripe Elements
- Real-time validation
- Support for multiple payment methods

✅ **Backend API Endpoint for Payment Intents**
- `/api/donations/checkout` - Creates payment intents
- Server-side validation
- Firebase integration

✅ **Stripe Webhook Handler**
- `/api/webhooks/stripe` - Processes payment events
- Updates campaign totals automatically
- Handles payment failures

✅ **Firebase Integration**
- Real-time campaign updates
- Donation history tracking
- Atomic transactions for data consistency

✅ **Error Handling and Loading States**
- Comprehensive error handling
- Loading states for better UX
- Toast notifications for feedback

✅ **Real-time Campaign Updates**
- Live donation counters
- Progress bars
- Recent donation history

✅ **Security Best Practices**
- Webhook signature verification
- Server-side validation
- Secure payment processing
- No sensitive data in client code

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check server logs

2. **Payment fails**
   - Verify Stripe keys are correct
   - Check payment method configuration
   - Review error logs

3. **Campaign totals not updating**
   - Check webhook is working
   - Verify Firebase permissions
   - Check transaction logs

### Support

For issues with:
- **Stripe:** Contact Stripe Support
- **Firebase:** Check Firebase Console
- **Application:** Review server logs and browser console

## API Endpoints

- `POST /api/donations/checkout` - Create payment intent
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `GET /api/donations/campaign` - Get campaigns
- `POST /api/donations/campaign` - Create campaign
- `GET /api/donations/history` - Get donation history

## Components

- `DonateModal` - Payment form with Stripe Elements
- `DonationHistory` - Display recent donations
- `useCampaignUpdates` - Real-time campaign updates hook 