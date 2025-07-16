const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
  console.error('❌ Firebase credentials not found in environment variables');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function manualWebhookFix() {
  try {
    console.log('🔧 Manually fixing donation statuses and campaign totals...\n');

    const campaignId = 'ROm9nGysY0CDK6SbWD5t';

    // Get all pending donations for this campaign
    const donationsSnapshot = await db.collection('donations')
      .where('campaignId', '==', campaignId)
      .where('status', '==', 'pending')
      .get();

    console.log(`📋 Found ${donationsSnapshot.size} pending donations`);

    if (donationsSnapshot.empty) {
      console.log('✅ No pending donations found');
      return;
    }

    // Update all pending donations to succeeded
    const batch = db.batch();
    let totalAmount = 0;

    donationsSnapshot.docs.forEach(doc => {
      const donation = doc.data();
      console.log(`💰 Processing donation: ${donation.amount} MYR from ${donation.donorEmail}`);
      
      batch.update(doc.ref, {
        status: 'succeeded',
        timestamp: new Date().toISOString(),
      });
      
      totalAmount += donation.amount;
    });

    // Commit the batch update
    await batch.commit();
    console.log(`✅ Updated ${donationsSnapshot.size} donations to succeeded status`);

    // Now update campaign totals
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      console.error('❌ Campaign not found');
      return;
    }

    const campaignData = campaignDoc.data();
    const newTotalRaised = (campaignData?.totalRaised || 0) + totalAmount;
    const newDonationCount = (campaignData?.donationCount || 0) + donationsSnapshot.size;

    console.log(`📊 Updating campaign totals:`);
    console.log(`   Current: ${campaignData?.totalRaised || 0} MYR, ${campaignData?.donationCount || 0} donations`);
    console.log(`   Adding: ${totalAmount} MYR, ${donationsSnapshot.size} donations`);
    console.log(`   New Total: ${newTotalRaised} MYR, ${newDonationCount} donations`);

    await campaignRef.update({
      totalRaised: newTotalRaised,
      donationCount: newDonationCount,
    });

    console.log('✅ Successfully updated campaign totals!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

manualWebhookFix(); 