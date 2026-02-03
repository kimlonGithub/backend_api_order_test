// Mock PrismaService before any imports to avoid loading the generated Prisma client
jest.mock('./prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      $queryRaw: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, PrismaService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should call AppService.getHello', () => {
      const serviceSpy = jest.spyOn(appService, 'getHello');
      appController.getHello();
      expect(serviceSpy).toHaveBeenCalled();
    });
  });

  describe('testDatabase', () => {
    it('should return success when database connection works', async () => {
      const mockResult = [
        {
          current_time: new Date('2026-01-27T10:00:00Z'),
          pg_version: 'PostgreSQL 14.0',
        },
      ];

      jest
        .spyOn(prismaService, '$queryRaw')
        .mockResolvedValue(mockResult as never);

      const result = await appController.testDatabase();

      expect(result).toHaveProperty('status', 'success');
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual(mockResult[0]);
    });

    it('should return error when database connection fails', async () => {
      const mockError = new Error('Connection failed');

      jest
        .spyOn(prismaService as any, '$queryRaw')
        .mockRejectedValue(mockError);

      const result = await appController.testDatabase();

      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('message', 'Database connection failed');
      expect(result).toHaveProperty('error', 'Connection failed');
    });
  });
});
