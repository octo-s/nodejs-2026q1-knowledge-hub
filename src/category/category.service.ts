import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { paginate } from '../common/pagination.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { page?: number; limit?: number }) {
    const categories = await this.prisma.category.findMany();
    return paginate(categories, query?.page, query?.limit);
  }

  async findOne(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.prisma.category.delete({ where: { id } });
  }
}
