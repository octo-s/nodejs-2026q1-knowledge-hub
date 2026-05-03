import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranslateArticleDto {
  @ApiProperty({
    example: 'French',
    description:
      'Target language for translation (BCP-47 code or English name)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  targetLanguage!: string;

  @ApiPropertyOptional({
    example: 'English',
    description: 'Source language hint. If omitted, Gemini auto-detects.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceLanguage?: string;
}
