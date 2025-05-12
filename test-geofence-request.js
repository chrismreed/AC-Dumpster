// Simple test script for geofencing calculation
const axios = require('axios');

async function testGeofencePricing() {
  try {
    // Test address inside geofence zone
    const nearbyResponse = await axios.post('http://localhost:5000/api/calculate-price', {
      dumpsterId: 3, // Using the 30 yard dumpster
      rentalDurationId: 1, // 3-day rental
      deliveryZipCode: '62401',
      deliveryAddress: '210 W Jefferson Ave',
      deliveryCity: 'Effingham, IL',
      selectedAddOns: []
    });
    
    console.log('=== NEARBY ADDRESS TEST ===');
    console.log(JSON.stringify(nearbyResponse.data, null, 2));
    
    // Test address further away (should have higher fee)
    const distantResponse = await axios.post('http://localhost:5000/api/calculate-price', {
      dumpsterId: 3,
      rentalDurationId: 1,
      deliveryZipCode: '62474',
      deliveryAddress: '123 Main St',
      deliveryCity: 'Teutopolis, IL',
      selectedAddOns: []
    });
    
    console.log('\n=== DISTANT ADDRESS TEST ===');
    console.log(JSON.stringify(distantResponse.data, null, 2));
    
    // Test address without full details (should fall back to ZIP-based pricing)
    const zipOnlyResponse = await axios.post('http://localhost:5000/api/calculate-price', {
      dumpsterId: 3,
      rentalDurationId: 1,
      deliveryZipCode: '62401',
      selectedAddOns: []
    });
    
    console.log('\n=== ZIP CODE ONLY TEST ===');
    console.log(JSON.stringify(zipOnlyResponse.data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testGeofencePricing();