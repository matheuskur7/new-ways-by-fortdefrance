import { IsString, Matches, MaxLength } from 'class-validator';

export class ImageTagDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, {
    message: 'Tag deve conter apenas letras, números, hífens e underscores.',
  })
  tag: string;
}
