const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const CAMPAIGN_ID = 'ROm9nGysY0CDK6SbWD5t';

async function checkDonations() {
  try {
    console.log('🔍 Checking donation status...\n');

    // Check current campaign totals
    const totalsResponse = await fetch(`${BASE_URL}/api/donations/update-totals?campaignId=${CAMPAIGN_ID}`);
    const totalsData = await totalsResponse.json();
    
    console.log('📊 Current Campaign Status:');
    console.log(JSON.stringify(totalsData, null, 2));
    
    // If totals need updating, update them
    if (totalsData.totals?.needsUpdate) {
      console.log('\n🔄 Updating campaign totals...');
      
      const updateResponse = await fetch(`${BASE_URL}/api/donations/update-totals?campaignId=${CAMPAIGN_ID}`, {
        method: 'POST'
      });
      const updateData = await updateResponse.json();
      
      console.log('✅ Update Result:');
      console.log(JSON.stringify(updateData, null, 2));
    } else {
      console.log('\n✅ Campaign totals are up to date!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDonations(); 