import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTranslateRegionLocaleDto } from './create-translate-region-locale.dto';

export class CreateTranslateRegionDto {
  @ApiProperty({ example: 'th', description: 'Region code (e.g. asia, th, kh)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  id: string;

  @ApiProperty({ example: 'Thailand' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Thailand' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nativeName: string;

  @ApiProperty({ example: '/translate/th.png' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  flagUrl: string;

  @ApiProperty({ example: 'th', description: 'Default locale for this region' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  defaultLocale: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Supported locales for this region (created in translate_region_locales)',
    type: [CreateTranslateRegionLocaleDto],
  })
  @IsOptional()
  @IsArray()
  @Type(() => CreateTranslateRegionLocaleDto)
  supportedLocales?: CreateTranslateRegionLocaleDto[];
}
