import { Module } from '@nestjs/common';
import { TranslateRegionsController } from './translate-regions.controller';
import { TranslateRegionsService } from './translate-regions.service';

@Module({
  controllers: [TranslateRegionsController],
  providers: [TranslateRegionsService],
  exports: [TranslateRegionsService],
})
export class TranslateRegionsModule { }
