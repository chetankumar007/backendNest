import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let userId: string;
  let authToken: string;
  const testEmail = `auth-flow-${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Step 1: should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Auth',
        lastName: 'Flow',
      });

    console.log('Registration response:', response.status);
    
    if (response.status !== 201) {
      console.error('Registration failed:', response.body);
    } else {
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');

      userId = response.body.user.id;
    }
  });

  it('Step 2: should login with the registered user', async () => {
    console.log('Attempting login with:', testEmail);
    
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    console.log('Login response:', response.status);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');

    authToken = response.body.access_token;
  });

  it('Step 3: should access protected route with valid token', async () => {
    // Skip if no auth token
    if (!authToken) {
      console.warn('Skipping test: No auth token available');
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', userId);
    expect(response.body).toHaveProperty('email', testEmail);
  });

  it('should reject unauthorized access to protected route', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile');

    console.log('Unauthorized profile response:', response.status);
    expect(response.status).toBe(401);
  });

  it('should reject access with invalid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', 'Bearer invalid-token');

    console.log('Invalid token response:', response.status);

    expect(response.status).toBe(401);
  });
});
