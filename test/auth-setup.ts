import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Creates a test user and returns an authentication token
 */
export async function setupAuth(app: INestApplication): Promise<string | null> {
  try {
    // Step 1: Create a test user if it doesn't exist
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      // Add any other required fields for your user entity
    };

    // Try to register the user
    // Note: You might need to adjust this endpoint based on your actual API
    try {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      console.log(
        'Register response:',
        registerResponse.status,
        registerResponse.body,
      );

      // If registration fails, it might be because the user already exists, which is fine
    } catch (error) {
      console.log(
        'Registration attempt error (might be ok if user exists):',
        error.message,
      );
    }

    // Step 2: Login with the test user
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response body:', loginResponse.body);

    // Extract token based on your API's response format
    // This might be loginResponse.body.access_token or loginResponse.body.token
    const token =
      loginResponse.body.access_token ||
      loginResponse.body.token ||
      loginResponse.body.accessToken;

    if (!token) {
      console.warn('No auth token received from login endpoint');
      // If you have a way to get or create a token directly, you could do it here
      return null;
    }

    return token;
  } catch (error) {
    console.error('Auth setup failed:', error.message);
    return null;
  }
}
