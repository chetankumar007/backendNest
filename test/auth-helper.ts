import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

/**
 * Helper function to get an authentication token for tests
 */
export async function getAuthToken(
  app: INestApplication,
): Promise<string | null> {
  try {
    // You need to adjust these values to match your actual auth system
    // This might be a test user that's seeded in your test database
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    // Adjust the endpoint to match your actual auth endpoint
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginCredentials);

    if (response.status !== 200 && response.status !== 201) {
      console.error('Auth failed:', response.status, response.body);
      return null;
    }

    // Adjust this to match your actual response structure
    return response.body.access_token || response.body.token;
  } catch (error) {
    console.error('Error getting auth token:', error.message);
    return null;
  }
}
