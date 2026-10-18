import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerType } from '../../../generated/prisma/client.js';

export class CreateCustomerDto {
  @ApiProperty({ maxLength: 255 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'CPF/CNPJ obrigatório, contendo de 11 a 14 dígitos.',
  })
  @IsString()
  @Matches(/^\d{11,14}$/, {
    message: 'CPF/CNPJ deve conter de 11 a 14 dígitos.',
  })
  cpfCnpj: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @Matches(/^\d{1,20}$/, {
    message: 'O telefone deve conter apenas números, com até 20 dígitos.',
  })
  phone: string;

  @ApiProperty({ enum: CustomerType })
  @IsEnum(CustomerType)
  type: CustomerType;
}
