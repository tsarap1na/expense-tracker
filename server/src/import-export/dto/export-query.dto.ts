import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class ExportQueryDto {
    @ApiPropertyOptional({ example: '2026-08-01' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ example: '2026-09-05' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({ enum: ['json', 'csv'], default: 'json' })
    @IsOptional()
    @IsIn(['json', 'csv'])
    format?: 'json' | 'csv' = 'json';
}