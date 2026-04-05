import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/pagination.dto';

export class CommentQueryDto extends PaginationQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  articleId: string;
}
