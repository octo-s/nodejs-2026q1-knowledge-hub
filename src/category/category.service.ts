import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { validate as uuidValidate } from 'uuid';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ArticleService } from '../article/article.service';

@Injectable()
export class CategoryService {
  private categories: Category[] = [];

  constructor(private readonly articleService: ArticleService) {}

  findAll(): Category[] {
    return this.categories;
  }

  findOne(id: string): Category {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const category = this.categories.find((c) => c.id === id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
    };
    this.categories.push(category);
    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const category = this.categories.find((c) => c.id === id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;

    return category;
  }

  delete(id: string): void {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException('Category not found');
    }
    this.categories.splice(index, 1);
    this.articleService.nullifyCategory(id);
  }
}
