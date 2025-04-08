import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('DocumentsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testDocumentId: string | null;
  const testFilePath = path.join(process.cwd(), 'test', 'test-file.txt');

  // Create a test file if it doesn't exist
  beforeAll(async () => {
    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(
        testFilePath,
        'This is a test file for document upload testing.',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register a test user
    const email = `doc-test-${Date.now()}@example.com`;
    const password = 'Password123!';

    await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password,
      firstName: 'Doc',
      lastName: 'Test',
    });

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      });

    authToken = loginResponse.body.access_token;
    console.log('Auth token received for document tests');
  });

  afterAll(async () => {
    // Clean up test document if it was created
    if (testDocumentId) {
      try {
        await request(app.getHttpServer())
          .delete(`/documents/${testDocumentId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch (error) {
        console.error('Error cleaning up test document:', error);
      }
    }

    await app.close();
  });

  it('POST /documents - should upload a document', async () => {
    const response = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .field('title', 'Test Document')
      .field('description', 'This is a test document')
      .attach('file', testFilePath);

    console.log('Document upload response:', response.status);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', 'Test Document');
    expect(response.body).toHaveProperty(
      'description',
      'This is a test document',
    );
    expect(response.body).toHaveProperty('fileName');
    expect(response.body).toHaveProperty('originalName', 'test-file.txt');
    expect(response.body).toHaveProperty('mimeType');
    expect(response.body).toHaveProperty('fileSize');
    expect(response.body).toHaveProperty('filePath');
    expect(response.body).toHaveProperty('ownerId');

    // Save document ID for later tests
    testDocumentId = response.body.id;
    console.log('Created test document with ID:', testDocumentId);
  });

  it('GET /documents - should return list of documents', async () => {
    const response = await request(app.getHttpServer())
      .get('/documents')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Get documents response:', response.status);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('limit');

    // Should contain our test document
    if (testDocumentId) {
      const foundDocument = response.body.data.find(
        (doc) => doc.id === testDocumentId,
      );
      expect(foundDocument).toBeDefined();
    }
  });

  it('GET /documents/:id - should return a specific document', async () => {
    if (!testDocumentId) {
      console.warn('Skipping test: No test document ID available');
      return;
    }

    const response = await request(app.getHttpServer())
      .get(`/documents/${testDocumentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Get document by ID response:', response.status);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testDocumentId);
    expect(response.body).toHaveProperty('title', 'Test Document');
    expect(response.body).toHaveProperty(
      'description',
      'This is a test document',
    );
  });

  it('PATCH /documents/:id - should update document metadata', async () => {
    if (!testDocumentId) {
      console.warn('Skipping test: No test document ID available');
      return;
    }

    const response = await request(app.getHttpServer())
      .patch(`/documents/${testDocumentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Test Document',
        description: 'This document has been updated',
      });

    console.log('Update document response:', response.status);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testDocumentId);
    expect(response.body).toHaveProperty('title', 'Updated Test Document');
    expect(response.body).toHaveProperty(
      'description',
      'This document has been updated',
    );
  });

  it('GET /documents/:id/download - should download the document', async () => {
    if (!testDocumentId) {
      console.warn('Skipping test: No test document ID available');
      return;
    }

    const response = await request(app.getHttpServer())
      .get(`/documents/${testDocumentId}/download`)
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Download document response:', response.status);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBeDefined();
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.body).toBeDefined();
  });

  it('DELETE /documents/:id - should delete the document', async () => {
    if (!testDocumentId) {
      console.warn('Skipping test: No test document ID available');
      return;
    }

    const response = await request(app.getHttpServer())
      .delete(`/documents/${testDocumentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Delete document response:', response.status);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(testDocumentId);

    // Verify document is deleted
    const getResponse = await request(app.getHttpServer())
      .get(`/documents/${testDocumentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);

    // Clear test document ID since it's been deleted
    testDocumentId = null;
  });

  it('POST /documents - should reject upload without a file', async () => {
    const response = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .field('title', 'Test Document Without File')
      .field('description', 'This should fail');

    console.log('Document upload without file response:', response.status);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('GET /documents - should support pagination and filtering', async () => {
    const response = await request(app.getHttpServer())
      .get('/documents')
      .query({ page: 1, limit: 5, sortBy: 'createdAt', order: 'desc' })
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Get documents with pagination response:', response.status);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('limit', 5);

    // Documents should be sorted by createdAt in descending order
    const documents = response.body.data;
    if (documents.length > 1) {
      const firstDate = new Date(documents[0].createdAt).getTime();
      const secondDate = new Date(documents[1].createdAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });
});
