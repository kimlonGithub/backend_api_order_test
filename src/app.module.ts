import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { TranslateRegionsModule } from './translate-regions/translate-regions.module';

@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env',
    }),
    // Prisma module for database access
    PrismaModule,
    // Users module for User CRUD operations
    UsersModule,
    // Orders API + WebSocket gateway for new_order admin notifications
    OrdersModule,
    // Translate regions and region-locales CRUD
    TranslateRegionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
