import { Transform } from 'class-transformer';
import { IsString, Length, Matches, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 200)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^user-avatar\/[0-9a-f]{64}-[0-9a-f-]+\.jpg$/)
  imageKey?: string;
}
