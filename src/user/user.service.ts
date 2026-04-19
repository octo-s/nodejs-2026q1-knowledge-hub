import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { paginate } from '../common/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private get saltRounds(): number {
    const salt = Number(process.env.CRYPT_SALT);
    return Number.isFinite(salt) && salt > 0 ? salt : 10;
  }

  private excludePassword<T extends { password?: string }>(user: T) {
    const { password, ...result } = user;
    return result;
  }

  async findAll(query?: { page?: number; limit?: number }) {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        login: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return paginate(users, query?.page, query?.limit);
  }

  async findOne(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (existing) {
      throw new BadRequestException('Login already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        role: dto.role ? (dto.role.toUpperCase() as any) : undefined,
      },
    });
    return this.excludePassword(user);
  }

  async update(id: string, dto: UpdatePasswordDto) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new ForbiddenException('Old password is wrong');
    }

    const hashedNewPassword = await bcrypt.hash(
      dto.newPassword,
      this.saltRounds,
    );

    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });
    return this.excludePassword(updated);
  }

  async delete(id: string) {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction([
      this.prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      }),
      this.prisma.comment.deleteMany({
        where: { authorId: id },
      }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }
  async findByLoginWithPassword(login: string) {
    return this.prisma.user.findUnique({ where: { login } });
  }
}
