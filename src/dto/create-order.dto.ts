import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 29.99, minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional({ example: 1, description: 'Link order to existing user' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  customerId?: number;
}
