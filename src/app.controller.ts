import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Hello world' })
  @ApiResponse({ status: 200, description: 'Returns a greeting.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-db')
  @ApiOperation({ summary: 'Test database connection' })
  @ApiResponse({ status: 200, description: 'Database connection status and server time.' })
  async testDatabase() {
    try {
      const result = await this.prisma.$queryRaw<
        Array<{ current_time: Date; pg_version: string }>
      >`
        SELECT NOW() as current_time, version() as pg_version
      `;
      return {
        status: 'success',
        message: 'Database connection successful',
        data: result[0],
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
