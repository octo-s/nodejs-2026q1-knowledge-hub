import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { paginate } from '../common/pagination.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { articleId: string; page?: number; limit?: number }) {
    const comments = await this.prisma.comment.findMany({
      where: { articleId: query.articleId },
    });
    return paginate(comments, query.page, query.limit);
  }

  async findOne(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async create(dto: CreateCommentDto) {
    // Check article exists
    const article = await this.prisma.article.findUnique({
      where: { id: dto.articleId },
    });
    if (!article) {
      throw new UnprocessableEntityException(
        "Article with given articleId doesn't exist",
      );
    }
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId ?? null,
      },
    });
  }

  async delete(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.prisma.comment.delete({ where: { id } });
  }
}
