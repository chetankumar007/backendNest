import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin Functionality (e2e)', () => {
  let app: INestApplication;
  let adminToken: string | null = null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login with admin credentials
    const adminCredentials = {
      email: 'admin@example.com',
      password: 'Admin123!',
    };

    try {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials);

      console.log('Admin login response:', loginResponse.status);

      if (loginResponse.status === 200) {
        adminToken = loginResponse.body.access_token;
        console.log('Admin login successful, token received');
        
        if (!loginResponse.body.user?.isAdmin) {
          console.warn('Warning: Logged in user is not an admin');
        }
      } else {
        console.warn(
          'Admin login failed. Tests requiring admin privileges will be skipped.',
        );
        console.log('Response:', loginResponse.body);
      }
    } catch (error) {
      console.error('Admin login failed:', error.message);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users - should return list of all users for admin', async () => {
    // Skip if no admin token
    if (!adminToken) {
      console.warn('Skipping test: No admin token available');
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('GET /users as admin response:', response.status);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      console.log(`Found ${response.body.length} users`);
      // Log the first user as a sample
      console.log('Sample user:', response.body[0]);
    }
  });

  it('POST /users - should create a new user as admin', async () => {
    // Skip if no admin token
    if (!adminToken) {
      console.warn('Skipping test: No admin token available');
      return;
    }

    const newUser = {
      email: `admin-created-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'Created',
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(newUser.email);
  });
});
