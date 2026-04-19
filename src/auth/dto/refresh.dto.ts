import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Refresh token issued by /auth/login or /auth/refresh',
  })
  @Allow()
  refreshToken: string;
}
