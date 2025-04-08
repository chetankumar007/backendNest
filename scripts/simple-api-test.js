const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('Simple API Test');
  console.log(`Testing API at ${API_BASE_URL}`);
  console.log('-----------------------------------');

  try {
    // Test 1: Check if the server is running
    console.log('\nTest 1: Checking if server is running...');
    try {
      const response = await axios.get(API_BASE_URL);
      console.log(`✅ Server is running. Status: ${response.status}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running or not accessible');
        console.log('Make sure your NestJS server is running on port 3001');
        return;
      } else if (error.response && error.response.status === 404) {
        console.log(
          '✅ Server is running but root path returns 404 (this is normal)',
        );
      } else {
        console.log(
          `✅ Server is running but returned error: ${error.message}`,
        );
      }
    }

    // Test 2: Try to register a user
    console.log('\nTest 2: Trying to register a user...');
    const testUser = {
      firstName: 'API',
      lastName: 'Tester',
      email: `api-test-${Date.now()}@example.com`,
      password: 'Password123!',
    };

    let registrationSuccessful = false;

    try {
      const registerResponse = await axios.post(
        `${API_BASE_URL}/auth/register`,
        testUser,
      );
      console.log(
        `✅ Registration successful. Status: ${registerResponse.status}`,
      );
      console.log('Response:', registerResponse.data);
      registrationSuccessful = true;
    } catch (error) {
      if (error.response) {
        console.log(`❌ Registration failed. Status: ${error.response.status}`);
        console.log('Error response:', error.response.data);

        // Check if it's a validation error
        if (error.response.status === 400) {
          console.log(
            '\nThis might be a validation error. Required fields might be:',
          );
          console.log('- firstName (string, non-empty)');
          console.log('- lastName (string, non-empty)');
          console.log('- email (valid email format)');
          console.log('- password (might have specific requirements)');
        }

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
            const altResponse = await axios.post(
              `${API_BASE_URL}${path}`,
              testUser,
            );
            console.log(`✅ Found working registration endpoint: ${path}`);
            console.log('Response:', altResponse.data);
            registrationSuccessful = true;
            break;
          } catch (altError) {
            if (altError.response && altError.response.status !== 404) {
              console.log(
                `Possible endpoint ${path}: Status ${altError.response.status}`,
              );
            }
          }
        }
      } else {
        console.log(`❌ Registration request failed: ${error.message}`);
      }
    }

    // Test 3: Try to login
    console.log('\nTest 3: Trying to login...');
    let authToken = null;

    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });

      console.log(`✅ Login successful. Status: ${loginResponse.status}`);
      console.log('Response:', loginResponse.data);

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
    } catch (error) {
      if (error.response) {
        console.log(`❌ Login failed. Status: ${error.response.status}`);
        console.log('Error response:', error.response.data);

        // Check if the endpoint might be different
        console.log('\nTrying alternative login endpoints...');
        const alternatives = [
          '/login',
          '/signin',
          '/api/auth/login',
          '/api/login',
        ];

        for (const path of alternatives) {
          try {
            const altResponse = await axios.post(`${API_BASE_URL}${path}`, {
              email: testUser.email,
              password: testUser.password,
            });

            console.log(`✅ Found working login endpoint: ${path}`);
            console.log('Response:', altResponse.data);

            // Try to extract token
            authToken =
              altResponse.data.access_token ||
              altResponse.data.token ||
              altResponse.data.accessToken;

            if (authToken) {
              console.log('✅ Auth token received');
            }

            break;
          } catch (altError) {
            if (altError.response && altError.response.status !== 404) {
              console.log(
                `Possible endpoint ${path}: Status ${altError.response.status}`,
              );
            }
          }
        }
      } else {
        console.log(`❌ Login request failed: ${error.message}`);
      }
    }

    // Test 4: Try to access users endpoint
    console.log('\nTest 4: Trying to access users endpoint...');

    try {
      const config = {};
      if (authToken) {
        config.headers = { Authorization: `Bearer ${authToken}` };
      }

      const usersResponse = await axios.get(`${API_BASE_URL}/users`, config);
      console.log(
        `✅ Users endpoint accessible. Status: ${usersResponse.status}`,
      );
      console.log('Response:', usersResponse.data);
    } catch (error) {
      if (error.response) {
        console.log(
          `❌ Users endpoint access failed. Status: ${error.response.status}`,
        );
        console.log('Error response:', error.response.data);

        if (error.response.status === 401) {
          console.log(
            'This is an authentication error. The endpoint exists but requires authentication.',
          );
        }
      } else {
        console.log(`❌ Users endpoint request failed: ${error.message}`);
      }
    }

    console.log('\nAPI test complete');
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

testAPI();
