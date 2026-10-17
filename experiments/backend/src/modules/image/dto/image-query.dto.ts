import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../shared/pagination/pagination-query.dto.js';

import { ACCEPTED_IMAGE_TAGS } from './image-tag.dto.js';

export class ImageQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filtra pela tag exata.',
    example: ACCEPTED_IMAGE_TAGS[0],
    enum: ACCEPTED_IMAGE_TAGS,
    minLength: 1,
    maxLength: 100,
    pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]*$',
  })
  @IsOptional()
  @IsIn(ACCEPTED_IMAGE_TAGS, { message: 'Tag não permitida.' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
  tag?: string;
}
