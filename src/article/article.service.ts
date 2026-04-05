import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { validate as uuidValidate } from 'uuid';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '../common/enums';
import { CommentService } from '../comment/comment.service';
import { paginate, PaginatedResult } from '../common/pagination.dto';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  findAll(query: {
    status?: string;
    categoryId?: string;
    tag?: string;
    page?: number;
    limit?: number;
  }): Article[] | PaginatedResult<Article> {
    let result = [...this.articles];

    if (query.status) {
      result = result.filter((a) => a.status === query.status);
    }
    if (query.categoryId) {
      result = result.filter((a) => a.categoryId === query.categoryId);
    }
    if (query.tag) {
      result = result.filter((a) => a.tags.includes(query.tag));
    }

    return paginate(result, query.page, query.limit);
  }

  findOne(id: string): Article {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  create(dto: CreateArticleDto): Article {
    const now = Date.now();
    const article: Article = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      status: dto.status ?? ArticleStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.articles.push(article);
    return article;
  }

  update(id: string, dto: UpdateArticleDto): Article {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (dto.title !== undefined) article.title = dto.title;
    if (dto.content !== undefined) article.content = dto.content;
    if (dto.status !== undefined) article.status = dto.status;
    if (dto.authorId !== undefined) article.authorId = dto.authorId;
    if (dto.categoryId !== undefined) article.categoryId = dto.categoryId;
    if (dto.tags !== undefined) article.tags = dto.tags;
    article.updatedAt = Date.now();

    return article;
  }

  delete(id: string): void {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const index = this.articles.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new NotFoundException('Article not found');
    }
    this.articles.splice(index, 1);
    this.commentService.deleteByArticle(id);
  }

  exists(id: string): boolean {
    return this.articles.some((a) => a.id === id);
  }

  nullifyAuthor(userId: string): void {
    this.articles.forEach((a) => {
      if (a.authorId === userId) {
        a.authorId = null;
      }
    });
  }

  nullifyCategory(categoryId: string): void {
    this.articles.forEach((a) => {
      if (a.categoryId === categoryId) {
        a.categoryId = null;
      }
    });
  }
}
