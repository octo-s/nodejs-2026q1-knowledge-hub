import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { validate as uuidValidate } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserRole } from '../common/enums';
import { User } from './entities/user.entity';
import { ArticleService } from '../article/article.service';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  private toResponse(user: User): Omit<User, 'password'> {
    return {
      id: user.id,
      login: user.login,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  findAll(): Omit<User, 'password'>[] {
    return this.users.map((user) => this.toResponse(user));
  }

  findOne(id: string): Omit<User, 'password'> {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponse(user);
  }

  create(dto: CreateUserDto): Omit<User, 'password'> {
    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      login: dto.login,
      password: dto.password,
      role: dto.role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return this.toResponse(user);
  }

  update(id: string, dto: UpdatePasswordDto): Omit<User, 'password'> {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.password !== dto.oldPassword) {
      throw new ForbiddenException('Old password is wrong');
    }
    user.password = dto.newPassword;
    user.updatedAt = Date.now();
    return this.toResponse(user);
  }

  delete(id: string): void {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException('User not found');
    }
    this.users.splice(index, 1);
    this.articleService.nullifyAuthor(id);
  }
}
