/**
 * Fix campaign totals by recalculating from succeeded donations
 * Run with: node scripts/fix-campaign-totals.js
 */

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
  console.log('Make sure you have these in your .env.local:');
  console.log('- FIREBASE_PROJECT_ID');
  console.log('- FIREBASE_PRIVATE_KEY');
  console.log('- FIREBASE_CLIENT_EMAIL');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixCampaignTotals() {
  try {
    console.log('🔧 Fixing campaign totals from succeeded donations...\n');

    // Get all campaigns
    const campaignsSnapshot = await db.collection('campaigns').get();
    console.log(`📋 Found ${campaignsSnapshot.size} campaigns`);

    for (const campaignDoc of campaignsSnapshot.docs) {
      const campaignId = campaignDoc.id;
      const campaignData = campaignDoc.data();
      
      console.log(`\n🎯 Processing campaign: ${campaignData.title} (${campaignId})`);
      console.log(`   Current totals: ${campaignData.totalRaised || 0} MYR, ${campaignData.donationCount || 0} donations`);

      // Get all succeeded donations for this campaign
      const donationsSnapshot = await db.collection('donations')
        .where('campaignId', '==', campaignId)
        .where('status', '==', 'succeeded')
        .get();

      console.log(`   Found ${donationsSnapshot.size} succeeded donations`);

      if (donationsSnapshot.empty) {
        console.log('   ✅ No donations to process');
        continue;
      }

      // Calculate actual totals
      let actualTotalRaised = 0;
      let actualDonationCount = 0;

      donationsSnapshot.docs.forEach(doc => {
        const donation = doc.data();
        actualTotalRaised += donation.amount;
        actualDonationCount += 1;
        
        console.log(`     💰 ${donation.amount} MYR from ${donation.donorEmail} on ${new Date(donation.timestamp).toLocaleDateString()}`);
      });

      console.log(`   📊 Calculated totals: ${actualTotalRaised} MYR, ${actualDonationCount} donations`);

      // Check if update is needed
      const currentTotal = campaignData.totalRaised || 0;
      const currentCount = campaignData.donationCount || 0;

      if (currentTotal !== actualTotalRaised || currentCount !== actualDonationCount) {
        console.log(`   🔄 Updating campaign totals...`);
        
        await campaignDoc.ref.update({
          totalRaised: actualTotalRaised,
          donationCount: actualDonationCount,
          lastUpdated: new Date().toISOString(),
        });

        console.log(`   ✅ Updated! ${currentTotal} → ${actualTotalRaised} MYR, ${currentCount} → ${actualDonationCount} donations`);
      } else {
        console.log(`   ✅ Totals are already correct`);
      }
    }

    console.log('\n🎉 Campaign totals fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCampaignTotals();
