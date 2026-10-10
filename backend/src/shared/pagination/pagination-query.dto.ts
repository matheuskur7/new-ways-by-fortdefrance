import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 1,
    minimum: 1,
    maximum: 42949673,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro.' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1.' })
  @Max(42949673, { message: 'Página excede o limite de paginação.' })
  page = 1;
}
