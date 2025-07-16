/**
 * Test script for donation system
 * Run with: node scripts/test-donation.js
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testDonationSystem() {
  console.log('🧪 Testing Donation System...\n');

  try {
    // Test 1: Create a test campaign
    console.log('1. Creating test campaign...');
    const campaignData = {
      title: 'Test Campaign',
      description: 'This is a test campaign for donation system',
      goalAmount: 1000,
      imageUrl: 'https://via.placeholder.com/400x200'
    };

    const createResponse = await fetch(`${BASE_URL}/api/donations/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create campaign: ${createResponse.statusText}`);
    }

    const { campaign } = await createResponse.json();
    console.log('✅ Campaign created:', campaign.id);

    // Test 2: Get campaigns
    console.log('\n2. Fetching campaigns...');
    const getResponse = await fetch(`${BASE_URL}/api/donations/campaigns`);
    
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch campaigns: ${getResponse.statusText}`);
    }

    const { campaigns } = await getResponse.json();
    console.log('✅ Campaigns fetched:', campaigns.length);

    // Test 3: Create payment intent
    console.log('\n3. Creating payment intent...');
    const paymentData = {
      campaignId: campaign.id,
      amount: 50,
      donorEmail: 'test@example.com',
      donorName: 'Test Donor',
      message: 'Test donation message'
    };

    const paymentResponse = await fetch(`${BASE_URL}/api/donations/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      throw new Error(`Failed to create payment intent: ${error.error}`);
    }

    const { clientSecret, paymentIntentId } = await paymentResponse.json();
    console.log('✅ Payment intent created:', paymentIntentId);

    // Test 4: Get donation history
    console.log('\n4. Fetching donation history...');
    const historyResponse = await fetch(`${BASE_URL}/api/donations/history?campaignId=${campaign.id}`);
    
    if (!historyResponse.ok) {
      throw new Error(`Failed to fetch donation history: ${historyResponse.statusText}`);
    }

    const { donations } = await historyResponse.json();
    console.log('✅ Donation history fetched:', donations.length);

    console.log('\n🎉 All tests passed!');
    console.log('\nNext steps:');
    console.log('1. Visit /donate to see the donation page');
    console.log('2. Try making a donation with test card: 4242 4242 4242 4242');
    console.log('3. Check that webhooks update campaign totals');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testDonationSystem(); 