// Mock PrismaService before any imports to avoid loading the generated Prisma client
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      $queryRaw: jest.fn().mockResolvedValue([
        {
          current_time: new Date('2026-01-27T10:00:00Z'),
          pg_version: 'PostgreSQL 14.0',
        },
      ]),
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    })),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/test-db (GET)', () => {
    it('should successfully connect to the database', () => {
      return request(app.getHttpServer())
        .get('/test-db')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'success');
          expect(res.body).toHaveProperty(
            'message',
            'Database connection successful',
          );
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('current_time');
          expect(res.body.data).toHaveProperty('pg_version');
        });
    });
  });

  describe('/users (POST)', () => {
    it('should create a user successfully', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect((res.body as { name: string; email: string }).name).toBe(
            'John Doe',
          );
          expect((res.body as { email: string }).email).toBe(
            'john@example.com',
          );
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    it('should return 400 if name is missing', () => {
      const userData = {
        email: 'john@example.com',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(400);
    });

    it('should return 400 if email is missing', () => {
      const userData = {
        name: 'John Doe',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(400);
    });
  });

  describe('GET /users/:user_id', () => {
    it('should return a user when valid ID is provided', async () => {
      // Step 1: Create a user first
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = (createResponse.body as { id: number }).id;

      // Step 2: Get the user by ID
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect((res.body as { name: string }).name).toBe('John Doe');
          expect((res.body as { email: string }).email).toBe(
            'john@example.com',
          );
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    it('should return 404 when user does not exist', () => {
      const nonExistentId = 999999;

      return request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect((res.body as { message: string }).message).toContain(
            'not found',
          );
        });
    });

    it('should return 400 when ID is not a number', () => {
      return request(app.getHttpServer()).get('/users/abc').expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return an array of users', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('PATCH /users/:user_id', () => {
    it('should update a user successfully', async () => {
      // Step 1: Create a user first
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = (createResponse.body as { id: number }).id;

      // Step 2: Update the user
      const updateData = {
        name: 'Jane Doe',
      };

      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect((res.body as { name: string }).name).toBe('Jane Doe');
        });
    });

    it('should return 404 when updating non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/users/999999')
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /users/:user_id', () => {
    it('should delete a user successfully', async () => {
      // Step 1: Create a user first
      const userData = {
        name: 'John Doe',
        email: 'delete@example.com',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = (createResponse.body as { id: number }).id;

      // Step 2: Delete the user
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent user', () => {
      return request(app.getHttpServer()).delete('/users/999999').expect(404);
    });
  });
});
