import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { paginate } from '../common/pagination.dto';

function mapArticleStatus(status: string): string {
  return status.toLowerCase();
}

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    tags: {
      include: {
        tag: true,
      },
    },
  };

  private formatArticle(article: any) {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      status: mapArticleStatus(article.status),
      authorId: article.authorId,
      categoryId: article.categoryId,
      tags: article.tags?.map((at: any) => at.tag.name) ?? [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }

  async findAll(query: {
    status?: string;
    categoryId?: string;
    tag?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (query.status) {
      where.status = query.status.toUpperCase();
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.tag) {
      where.tags = {
        some: {
          tag: {
            name: query.tag,
          },
        },
      };
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: this.includeRelations,
    });

    const formatted = articles.map((a) => this.formatArticle(a));
    return paginate(formatted, query.page, query.limit);
  }

  async findOne(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return this.formatArticle(article);
  }

  async create(dto: CreateArticleDto) {
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: dto.status ? (dto.status.toUpperCase() as any) : undefined,
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: dto.tags
          ? {
              create: dto.tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            }
          : undefined,
      },
      include: this.includeRelations,
    });
    return this.formatArticle(article);
  }

  async update(id: string, dto: UpdateArticleDto) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Article not found');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.status !== undefined) data.status = dto.status.toUpperCase();
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;

    if (dto.tags !== undefined) {
      data.tags = {
        deleteMany: {},
        create: dto.tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: { name: tagName },
            },
          },
        })),
      };
    }

    const article = await this.prisma.article.update({
      where: { id },
      data,
      include: this.includeRelations,
    });
    return this.formatArticle(article);
  }

  async delete(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    await this.prisma.article.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const article = await this.prisma.article.findUnique({ where: { id } });
    return !!article;
  }
}
