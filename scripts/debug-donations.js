/**
 * Debug script to check donation status and webhook issues
 * Run with: node scripts/debug-donations.js
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
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function debugDonations() {
  try {
    console.log('🔍 Debugging donation system...\n');

    // Check all donations
    const donationsSnapshot = await db.collection('donations').get();
    console.log(`📊 Total donations in database: ${donationsSnapshot.size}`);

    let pendingCount = 0;
    let succeededCount = 0;
    let failedCount = 0;

    const statusBreakdown = {};
    const campaignBreakdown = {};

    donationsSnapshot.docs.forEach(doc => {
      const donation = doc.data();
      const status = donation.status;
      const campaignId = donation.campaignId;

      // Count by status
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      
      // Count by campaign
      if (!campaignBreakdown[campaignId]) {
        campaignBreakdown[campaignId] = { pending: 0, succeeded: 0, failed: 0, total: 0 };
      }
      campaignBreakdown[campaignId][status] = (campaignBreakdown[campaignId][status] || 0) + 1;
      campaignBreakdown[campaignId].total += 1;

      if (status === 'pending') {
        pendingCount++;
        console.log(`⏳ PENDING: ${donation.amount} MYR from ${donation.donorEmail} (${new Date(donation.timestamp).toLocaleString()})`);
      } else if (status === 'succeeded') {
        succeededCount++;
      } else if (status === 'failed') {
        failedCount++;
      }
    });

    console.log('\n📈 Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      const emoji = status === 'pending' ? '⏳' : status === 'succeeded' ? '✅' : '❌';
      console.log(`   ${emoji} ${status}: ${count}`);
    });

    console.log('\n🎯 Campaign Breakdown:');
    for (const [campaignId, stats] of Object.entries(campaignBreakdown)) {
      const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
      const campaignData = campaignDoc.exists ? campaignDoc.data() : null;
      const campaignTitle = campaignData?.title || 'Unknown Campaign';
      
      console.log(`   📋 ${campaignTitle} (${campaignId}):`);
      console.log(`      Total: ${stats.total} donations`);
      console.log(`      ✅ Succeeded: ${stats.succeeded || 0}`);
      console.log(`      ⏳ Pending: ${stats.pending || 0}`);
      console.log(`      ❌ Failed: ${stats.failed || 0}`);
      console.log(`      💰 Campaign Total Raised: ${campaignData?.totalRaised || 0} MYR`);
      console.log(`      📊 Campaign Donation Count: ${campaignData?.donationCount || 0}`);
      console.log('');
    }

    if (pendingCount > 0) {
      console.log(`\n⚠️  WARNING: You have ${pendingCount} pending donations that may need manual processing.`);
      console.log('   This suggests that Stripe webhooks are not working properly.');
      console.log('   You can run the manual-webhook-fix.js script to fix them.');
    } else {
      console.log('\n✅ All donations have been processed successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugDonations();
