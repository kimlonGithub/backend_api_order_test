import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTranslateRegionLocaleDto {
  @ApiProperty({ example: 'en', description: 'Locale code (e.g. en, th, zh)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  localeCode: string;

  @ApiPropertyOptional({ example: 0, description: 'Order in the list (lower first)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
