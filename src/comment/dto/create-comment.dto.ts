import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great article!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'uuid-of-article' })
  @IsUUID()
  @IsNotEmpty()
  articleId: string;

  @ApiPropertyOptional({ example: 'uuid-of-author' })
  @IsUUID()
  @IsOptional()
  authorId?: string;
}
