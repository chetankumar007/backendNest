import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get auth token (if your API requires authentication)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test@example.com', password: 'password123' });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users - should return list of users', async () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('email');
        }
      });
  });

  it('POST /users - should create a new user', async () => {
    const newUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
    };

    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(newUser.name);
        expect(res.body.email).toBe(newUser.email);
        expect(res.body).not.toHaveProperty('password'); // Password should not be returned
      });
  });

  it('GET /users/:id - should return a specific user', async () => {
    // First create a user to get an ID
    const newUser = {
      name: 'Get User Test',
      email: `get-test-${Date.now()}@example.com`,
      password: 'password123',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser)
      .expect(201);

    const userId = createResponse.body.id;

    // Now test getting that specific user
    return request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id', userId);
        expect(res.body.name).toBe(newUser.name);
        expect(res.body.email).toBe(newUser.email);
      });
  });
});
