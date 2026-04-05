import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { validate as uuidValidate } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserRole } from '../common/enums';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private users: User[] = [];

  findAll(): Omit<User, 'password'>[] {
    return this.users.map(({ password, ...rest }) => rest);
  }

  findOne(id: string): Omit<User, 'password'> {
    if (!uuidValidate(id)) {
      throw new BadRequestException('Invalid UUID');
    }
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...rest } = user;
    return rest;
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
    const { password, ...rest } = user;
    return rest;
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
    const { password, ...rest } = user;
    return rest;
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
    // Каскадное удаление будет добавлено позже
  }
}