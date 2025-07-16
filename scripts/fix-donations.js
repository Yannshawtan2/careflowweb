const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const CAMPAIGN_ID = 'ROm9nGysY0CDK6SbWD5t';

async function fixDonations() {
  try {
    console.log('🔧 Fixing donation statuses and campaign totals...\n');

    // First, let's check what donations we have
    const historyResponse = await fetch(`${BASE_URL}/api/donations/history?campaignId=${CAMPAIGN_ID}&limit=10`);
    const historyData = await historyResponse.json();
    
    console.log('📋 All donations for this campaign:');
    console.log(JSON.stringify(historyData, null, 2));

    // Now manually update the campaign totals
    console.log('\n🔄 Manually updating campaign totals...');
    
    const updateResponse = await fetch(`${BASE_URL}/api/donations/update-totals?campaignId=${CAMPAIGN_ID}`, {
      method: 'POST'
    });
    const updateData = await updateResponse.json();
    
    console.log('✅ Update Result:');
    console.log(JSON.stringify(updateData, null, 2));

    // Check final status
    console.log('\n📊 Final Campaign Status:');
    const finalResponse = await fetch(`${BASE_URL}/api/donations/update-totals?campaignId=${CAMPAIGN_ID}`);
    const finalData = await finalResponse.json();
    console.log(JSON.stringify(finalData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDonations(); 