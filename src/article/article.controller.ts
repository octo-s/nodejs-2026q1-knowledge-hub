import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.types';
import { UserRole } from '../common/enums';

@ApiTags('Articles')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all articles' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: ArticleQueryDto) {
    return this.articleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOne(@Param('id') id: string) {
    return this.articleService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create article' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateArticleDto, @CurrentUser() user: JwtPayload) {
    const authorId =
      user.role === UserRole.ADMIN
        ? (dto.authorId ?? user.userId)
        : user.userId;
    return this.articleService.create({ ...dto, authorId });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update article' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.articleService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete article' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.articleService.delete(id, user);
  }
}
