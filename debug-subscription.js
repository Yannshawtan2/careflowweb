const Stripe = require('stripe');
const stripe = new Stripe('sk_test_51RZUDoCW4xUVJ5aieVKm3Y3LxpYXl1LBD0K83anmEmXq6ou0ScIzCXmsGfR8OraL1bIGi9zjSN0fC65oROf7PgWX00emhUL9JH');

async function debugSubscription() {
  try {
    const subscription = await stripe.subscriptions.retrieve('sub_1RmZIJCW4xUVJ5aiAQCQaadl', {
      expand: ['latest_invoice', 'default_payment_method']
    });
    
    console.log('Full subscription object:');
    console.log(JSON.stringify(subscription, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugSubscription();
