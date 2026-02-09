import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTranslateRegionDto {
  @ApiPropertyOptional({ example: 'Thailand' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Thailand' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nativeName?: string;

  @ApiPropertyOptional({ example: '/translate/th.png' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  flagUrl?: string;

  @ApiPropertyOptional({ example: 'th' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  defaultLocale?: string;

  @ApiPropertyOptional()
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
}
