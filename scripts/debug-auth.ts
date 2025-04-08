import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test user credentials
const testUser = {
  email: `debug-${Date.now()}@example.com`,
  password: 'Password123!',
  firstName: 'Debug',
  lastName: 'User',
};

async function debugAuth() {
  console.log('\nAuth Debugging Tool');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log('Test User:', testUser);

  // Step 1: Register a new user
  try {
    console.log('\n1. Registering test user...');
    const registerResponse = await axios({
      method: 'POST',
      url: `${API_BASE_URL}/auth/register`,
      data: testUser,
      validateStatus: () => true,
    });

    console.log(`Status: ${registerResponse.status}`);
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));

    if (registerResponse.status === 404) {
      console.log('Trying alternative registration via /users endpoint...');

      const createUserResponse = await axios({
        method: 'POST',
        url: `${API_BASE_URL}/users`,
        data: testUser,
        validateStatus: () => true,
      });

      console.log(`Status: ${createUserResponse.status}`);
      console.log(
        'Response:',
        JSON.stringify(createUserResponse.data, null, 2),
      );
    }
  } catch (error) {
    console.error('Registration error:', error.message);
  }

  // Step 2: Login with the registered user
  try {
    console.log('\n2. Logging in with test user...');
    const loginResponse = await axios({
      method: 'POST',
      url: `${API_BASE_URL}/auth/login`,
      data: {
        email: testUser.email,
        password: testUser.password,
      },
      validateStatus: () => true,
    });

    console.log(`Status: ${loginResponse.status}`);
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.status === 200 || loginResponse.status === 201) {
      const authToken =
        loginResponse.data.access_token ||
        loginResponse.data.token ||
        loginResponse.data.accessToken;

      if (authToken) {
        console.log('\n3. Testing profile access with token...');
        const profileResponse = await axios({
          method: 'GET',
          url: `${API_BASE_URL}/auth/profile`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          validateStatus: () => true,
        });

        console.log(`Status: ${profileResponse.status}`);
        console.log('Response:', JSON.stringify(profileResponse.data, null, 2));
      }
    }
  } catch (error) {
    console.error('Login error:', error.message);
  }

  console.log('\nDebugging complete');
}

debugAuth().catch(console.error);
