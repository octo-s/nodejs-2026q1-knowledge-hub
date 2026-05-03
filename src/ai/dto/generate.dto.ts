import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDto {
  @ApiProperty({
    description: 'Free-form prompt to send to Gemini',
    minLength: 1,
    maxLength: 8000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(8000)
  prompt!: string;

  @ApiPropertyOptional({
    description:
      'Optional session id for short-term conversation context (Hacker scope)',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;
}
