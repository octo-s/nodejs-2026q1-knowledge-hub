import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { validate as uuidValidate } from 'uuid';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ArticleService } from '../article/article.service';

@Injectable()
export class CommentService {
  private comments: Comment[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  findByArticle(articleId: string): Comment[] {
    return this.comments.filter((c) => c.articleId === articleId);
  }

  findOne(id: string): Comment {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  create(dto: CreateCommentDto): Comment {
    if (!this.articleService.exists(dto.articleId)) {
      throw new UnprocessableEntityException('Article not found');
    }

    const comment: Comment = {
      id: randomUUID(),
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
      createdAt: Date.now(),
    };
    this.comments.push(comment);
    return comment;
  }

  delete(id: string): void {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const index = this.comments.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException('Comment not found');
    }
    this.comments.splice(index, 1);
  }

  deleteByArticle(articleId: string): void {
    this.comments = this.comments.filter((c) => c.articleId !== articleId);
  }

  deleteByAuthor(authorId: string): void {
    this.comments = this.comments.filter((c) => c.authorId !== authorId);
  }
}
