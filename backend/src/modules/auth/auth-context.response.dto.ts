import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponse {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ type: String }) name: string;
  @ApiProperty({ type: String, format: 'email' }) email: string;
}

export class AuthOrganizationResponse {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ type: String }) name: string;
  @ApiProperty({ type: String }) slug: string;
  @ApiProperty({ type: String, description: 'Papel do membro na organização.' })
  role: string;
}

export class AuthContextResponse {
  @ApiProperty({ type: () => AuthUserResponse }) user: AuthUserResponse;
  @ApiProperty({ type: () => AuthOrganizationResponse, nullable: true })
  organization: AuthOrganizationResponse | null;
}
