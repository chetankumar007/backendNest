import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // IMPORTANT: Don't call app.listen() in tests, only init()
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should check available routes', async () => {
    // Test GET endpoints
    const getEndpoints = [
      '/',
      '/api',
      '/users',
      '/auth/login',
      '/auth/register',
      '/auth/profile',
      '/health',
      '/documents',
      '/categories'
    ];
    
    for (const endpoint of getEndpoints) {
      const response = await request(app.getHttpServer()).get(endpoint);
      console.log(`GET ${endpoint} status:`, response.status);
    }
    
    // Test POST endpoints with empty body
    const postEndpoints = [
      '/auth/login',
      '/users',
      '/documents',
      '/categories'
    ];
    
    for (const endpoint of postEndpoints) {
      const response = await request(app.getHttpServer())
        .post(endpoint)
        .send({});
      console.log(`POST ${endpoint} status:`, response.status);
    }
    
    // This test will pass, we're just gathering information
    expect(true).toBe(true);
  });
});
