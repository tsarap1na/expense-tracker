import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class QueryBudgetDto {
    @ApiPropertyOptional({ example: '2026-09', description: 'Format YYYY-MM' })
    @IsOptional()
    @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in format YYYY-MM' })
    month?: string;
}