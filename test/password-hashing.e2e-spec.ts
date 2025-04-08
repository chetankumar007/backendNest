import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('Password Hashing (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const testUser = {
    email: `password-test-${Date.now()}@example.com`,
    password: 'Password123!',
    firstName: 'Password',
    lastName: 'Test',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    userRepository = moduleFixture.get(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should hash password when creating a user', async () => {
    // Create a user
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send(testUser);

    console.log('User creation response:', createResponse.status);
    expect(createResponse.status).toBe(201);

    const userId = createResponse.body.id;

    // Retrieve the user directly from the database
    const savedUser = await userRepository.findOne({ where: { id: userId } });

    // Ensure the user was found
    expect(savedUser).not.toBeNull();
    
    // Verify the password is hashed
    expect(savedUser?.password).not.toBe(testUser.password);
    expect(savedUser?.password).toBeTruthy();

    // Verify the hash is valid and can be compared
    if (savedUser) {
      const isPasswordValid = await bcrypt.compare(
        testUser.password,
        savedUser.password,
      );
      expect(isPasswordValid).toBe(true);
    }

    console.log('Password hashing verified successfully');
  });

  it('should allow login with correct password', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    console.log('Login response:', loginResponse.status);
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('access_token');
  });

  it('should reject login with incorrect password', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    console.log('Login with wrong password response:', loginResponse.status);
    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body).not.toHaveProperty('access_token');
  });
});
