import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { paginate } from '../common/pagination.dto';
import { JwtPayload } from '../auth/auth.types';
import { UserRole } from '../common/enums';

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
  async delete(id: string, currentUser?: JwtPayload) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (
      currentUser &&
      currentUser.role === UserRole.EDITOR &&
      comment.authorId !== currentUser.userId
    ) {
      throw new ForbiddenException('You can delete only your own comments');
    }
    await this.prisma.comment.delete({ where: { id } });
  }

  async findByArticle(
    articleId: string,
    query?: { page?: number; limit?: number },
  ) {
    if (!uuidValidate(articleId)) {
      throw new BadRequestException('Invalid UUID');
    }
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      throw new UnprocessableEntityException('Article not found');
    }
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
    });
    return paginate(comments, query?.page, query?.limit);
  }
}
