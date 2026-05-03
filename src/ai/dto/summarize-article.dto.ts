import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type SummaryLength = 'short' | 'medium' | 'detailed';

export class SummarizeArticleDto {
  @ApiPropertyOptional({
    enum: ['short', 'medium', 'detailed'],
    default: 'medium',
    description: 'Desired summary length',
  })
  @IsOptional()
  @IsIn(['short', 'medium', 'detailed'])
  maxLength?: SummaryLength;
}
