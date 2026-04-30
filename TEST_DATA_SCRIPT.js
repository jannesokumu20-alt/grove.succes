// Test script to add test data to Grove app
// Run this in the browser console to populate test data

async function addTestData() {
  console.log('Starting test data addition...');

  // Get auth token from localStorage
  const authData = JSON.parse(localStorage.getItem('grove-auth-session') || '{}');
  const token = authData?.access_token;

  if (!token) {
    console.error('No auth token found. Please login first.');
    return;
  }

  const API_URL = 'http://localhost:3001';

  // Test members to add
  const testMembers = [
    { name: 'John Kariuki', phone: '0712345678' },
    { name: 'Mary Kipchoge', phone: '0723456789' },
    { name: 'James Omondi', phone: '0734567890' },
    { name: 'Sarah Mwangi', phone: '0745678901' },
  ];

  // Get current chama ID from store
  // This is a simplified approach - you may need to fetch it from the API
  console.log('Fetching chama data...');

  try {
    // Login flow to get chama
    console.log('Test data script ready. Populate manually through UI or use API calls.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
addTestData();
