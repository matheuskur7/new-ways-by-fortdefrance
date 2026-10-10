import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/pagination/pagination-query.dto.js';

export class ImageQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
  tag?: string;
}
