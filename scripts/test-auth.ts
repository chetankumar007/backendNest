import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test user credentials with unique email to avoid conflicts
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: `test-${Date.now()}@example.com`,
  password: 'Password123!',
};

async function testAuth() {
  console.log('\nAPI Authentication Tester');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log('\nTesting authentication flow...');

  let authToken = null;

  // Step 1: Try to register a new user
  try {
    console.log('\n1. Testing registration...');
    const registerResponse = await axios({
      method: 'POST',
      url: `${API_BASE_URL}/auth/register`,
      data: testUser,
      validateStatus: () => true,
    });

    console.log(`Status: ${registerResponse.status}`);
    console.log('Response:', registerResponse.data);

    if (registerResponse.status === 201) {
      console.log('✅ Registration successful');
    } else if (
      registerResponse.status === 400 &&
      registerResponse.data.message?.includes('already exists')
    ) {
      console.log('ℹ️ User already exists (this is fine)');
    } else if (registerResponse.status === 404) {
      console.log('❌ Registration endpoint not found');
      console.log('Trying alternative registration via /users endpoint...');
      
      const createUserResponse = await axios({
        method: 'POST',
        url: `${API_BASE_URL}/users`,
        data: testUser,
        validateStatus: () => true
      });
      
      console.log(`Status: ${createUserResponse.status}`);
      console.log('Response:', createUserResponse.data);
      
      if (createUserResponse.status === 201) {
        console.log('✅ User creation successful via /users endpoint');
      } else {
        console.log('❌ User creation failed');
      }
    } else {
      console.log('❌ Registration failed');
    }
  } catch (error) {
    console.error('❌ Registration request failed:', error.message);

    // Check if the endpoint might be different
    console.log('\nTrying alternative registration endpoints...');
    const alternatives = [
      '/register',
      '/signup',
      '/users',
      '/api/auth/register',
      '/api/register',
    ];

    for (const path of alternatives) {
      try {
        const response = await axios({
          method: 'POST',
          url: `${API_BASE_URL}${path}`,
          data: testUser,
          validateStatus: () => true,
        });

        if (response.status !== 404) {
          console.log(
            `Found possible registration endpoint: ${path} (Status: ${response.status})`,
          );
        }
      } catch (err) {
        // Ignore errors
      }
    }
  }

  // Step 2: Try to login
  try {
    console.log('\n2. Testing login...');
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
    console.log('Response:', loginResponse.data);

    if (loginResponse.status === 200 || loginResponse.status === 201) {
      console.log('✅ Login successful');

      // Try to extract token
      authToken =
        loginResponse.data.access_token ||
        loginResponse.data.token ||
        loginResponse.data.accessToken;

      if (authToken) {
        console.log('✅ Auth token received');
      } else {
        console.log('❌ No auth token found in response');
        console.log('Available fields:', Object.keys(loginResponse.data));
      }
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('❌ Login request failed:', error.message);

    // Check if the endpoint might be different
    console.log('\nTrying alternative login endpoints...');
    const alternatives = ['/login', '/signin', '/api/auth/login', '/api/login'];

    for (const path of alternatives) {
      try {
        const response = await axios({
          method: 'POST',
          url: `${API_BASE_URL}${path}`,
          data: {
            email: testUser.email,
            password: testUser.password,
          },
          validateStatus: () => true,
        });

        if (response.status !== 404) {
          console.log(
            `Found possible login endpoint: ${path} (Status: ${response.status})`,
          );
        }
      } catch (err) {
        // Ignore errors
      }
    }
  }

  // Step 3: Try to access a protected resource
  if (authToken) {
    try {
      console.log('\n3. Testing protected resource access...');
      
      // First try profile endpoint
      const profileResponse = await axios({
        method: 'GET',
        url: `${API_BASE_URL}/auth/profile`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        validateStatus: () => true,
      });

      if (profileResponse.status === 200) {
        console.log('✅ Successfully accessed profile');
        console.log('Profile data:', profileResponse.data);
      } else {
        console.log('❌ Failed to access profile, trying users endpoint...');
        
        // Try users endpoint as fallback
        const usersResponse = await axios({
          method: 'GET',
          url: `${API_BASE_URL}/users`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          validateStatus: () => true,
        });
        
        console.log(`Status: ${usersResponse.status}`);
        
        if (usersResponse.status === 200) {
          console.log('✅ Successfully accessed users endpoint');
        } else {
          console.log('❌ Failed to access protected resource');
          console.log('Response:', usersResponse.data);
        }
      }
    } catch (error) {
      console.error('❌ Protected resource request failed:', error.message);
    }
  } else {
    console.log('\n3. Skipping protected resource test (no auth token)');
  }

  console.log('\nAuthentication test complete');
}

testAuth().catch(console.error);
