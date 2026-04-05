import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export function paginate<T>(
  items: T[],
  page?: number,
  limit?: number,
): PaginatedResult<T> | T[] {
  if (page === undefined && limit === undefined) {
    return items;
  }

  const p = page ?? 1;
  const l = limit ?? 10;
  const total = items.length;
  const start = (p - 1) * l;
  const data = items.slice(start, start + l);

  return { data, page: p, limit: l, total };
}
