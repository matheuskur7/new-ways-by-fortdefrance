import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Senha atual para confirmar a exclusão da conta.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
