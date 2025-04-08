const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// Endpoints to test
const endpoints = [
  { method: 'GET', url: '/health', name: 'Health Check', requiresAuth: false },
  { method: 'GET', url: '/users', name: 'Get Users', requiresAuth: true },
  { method: 'GET', url: '/products', name: 'Get Products', requiresAuth: true },
  // Add more endpoints as needed
];

async function checkEndpoint(endpoint) {
  try {
    const config = {
      method: endpoint.method,
      url: `${API_BASE_URL}${endpoint.url}`,
      headers: {},
    };

    if (endpoint.requiresAuth) {
      config.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    console.log(
      `Testing ${endpoint.name} (${endpoint.method} ${endpoint.url})...`,
    );
    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    console.log(`✅ ${endpoint.name}: ${response.status} (${duration}ms)`);
    return true;
  } catch (error) {
    const statusCode = error.response ? error.response.status : 'NETWORK ERROR';
    console.error(`❌ ${endpoint.name}: ${statusCode}`);
    console.error(`   Error: ${error.message}`);
    if (error.response && error.response.data) {
      console.error(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runHealthCheck() {
  console.log(`\nAPI Health Check - ${new Date().toISOString()}`);
  console.log(`Base URL: ${API_BASE_URL}\n`);

  let successCount = 0;

  for (const endpoint of endpoints) {
    const success = await checkEndpoint(endpoint);
    if (success) successCount++;
    console.log(''); // Add a blank line between tests
  }

  console.log(
    `\nResults: ${successCount}/${endpoints.length} endpoints healthy\n`,
  );

  if (successCount !== endpoints.length) {
    process.exit(1); // Exit with error code if any endpoint failed
  }
}

runHealthCheck();
