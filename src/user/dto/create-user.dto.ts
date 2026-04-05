import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}