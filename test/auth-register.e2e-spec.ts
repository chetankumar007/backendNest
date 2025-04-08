import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication - Registration (e2e)', () => {
  let app: INestApplication;

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

  it('should register a new user', async () => {
    // Generate a unique email
    const email = `test-register-${Date.now()}@example.com`;

    const registerData = {
      email,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerData);

    console.log('Registration response:', response.status, response.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email', email);
    expect(response.body.user).not.toHaveProperty('password'); // Password should not be returned
  });

  it('should not register a user with invalid data', async () => {
    // Missing required fields
    const invalidData = {
      email: 'invalid-email',
      password: 'short',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(invalidData);

    console.log(
      'Invalid registration response:',
      response.status,
      response.body,
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('should not register a user with an existing email', async () => {
    // First, register a user
    const email = `test-duplicate-${Date.now()}@example.com`;

    const registerData = {
      email,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerData);

    // Try to register again with the same email
    const duplicateResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerData);

    console.log(
      'Duplicate registration response:',
      duplicateResponse.status,
      duplicateResponse.body,
    );

    expect(duplicateResponse.status).toBe(409); // Conflict
    expect(duplicateResponse.body).toHaveProperty(
      'message',
      'User with this email already exists',
    );
  });

  it('should be able to login after registration', async () => {
    // First, register a user
    const email = `test-login-${Date.now()}@example.com`;
    const password = 'Password123!';

    const registerData = {
      email,
      password,
      firstName: 'Test',
      lastName: 'User',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerData);

    // Then try to login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      });

    console.log('Login after registration response:', loginResponse.status);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('access_token');
    expect(loginResponse.body).toHaveProperty('user');
    expect(loginResponse.body.user).toHaveProperty('email', email);
  });
});
