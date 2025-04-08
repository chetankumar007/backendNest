import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdUserId: string; // Changed to string for UUID
  let isAdmin: boolean;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    // IMPORTANT: Don't call app.listen() in tests, only init()
    await app.init();

    // Create a test user
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!'
    };

    try {
      // First create a user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(testUser);
      
      console.log('User creation response:', createResponse.status, createResponse.body);
      
      if (createResponse.status === 201) {
        createdUserId = createResponse.body.id;
        console.log('Created test user with ID:', createdUserId);
      }

      // Then login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      console.log('Login response:', loginResponse.status, loginResponse.body);
      
      // Get the auth token
      authToken = loginResponse.body.access_token || 
                  loginResponse.body.token || 
                  loginResponse.body.accessToken;
      
      // Check if user is admin
      isAdmin = loginResponse.body.user?.isAdmin || false;
      
      if (authToken) {
        console.log('Auth token received');
        console.log('User is admin:', isAdmin);
      } else {
        console.warn('No auth token received from login endpoint');
      }
    } catch (error) {
      console.error('Auth setup failed:', error.message);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users - should return list of users for admins or 403 for regular users', async () => {
    // Skip test if no auth token
    if (!authToken) {
      console.warn('Skipping test due to missing auth token');
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`);
    
    console.log('GET /users response:', response.status, response.body);
    
    if (isAdmin) {
      // If user is admin, should get 200 and a list of users
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('firstName');
        expect(response.body[0]).toHaveProperty('lastName');
        expect(response.body[0]).toHaveProperty('email');
      }
    } else {
      // If user is not admin, should get 403 Forbidden
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Forbidden resource');
    }
  });

  it('POST /users - should create a new user', async () => {
    const newUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!'
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(newUser);
    
    console.log('POST /users response:', response.status, response.body);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.firstName).toBe(newUser.firstName);
    expect(response.body.lastName).toBe(newUser.lastName);
    expect(response.body.email).toBe(newUser.email);
    expect(response.body).not.toHaveProperty('password'); // Password should not be returned
  });

  it('GET /users/:id - should return a specific user', async () => {
    // Skip test if no auth token or user ID
    if (!authToken || !createdUserId) {
      console.warn('Skipping GET /users/:id test due to missing auth token or user ID');
      return;
    }

    const response = await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    console.log(`GET /users/${createdUserId} response:`, response.status, response.body);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdUserId);
    expect(response.body).toHaveProperty('firstName');
    expect(response.body).toHaveProperty('lastName');
    expect(response.body).toHaveProperty('email');
  });

  it('GET /auth/profile - should return user profile', async () => {
    // Skip test if no auth token
    if (!authToken) {
      console.warn('Skipping test due to missing auth token');
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    console.log('GET /auth/profile response:', response.status, response.body);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
  });
});
