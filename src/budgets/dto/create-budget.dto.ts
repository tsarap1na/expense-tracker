import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, Matches } from 'class-validator';

export class CreateBudgetDto {
    @ApiProperty({ example: 1, description: 'Category id' })
    @IsInt()
    categoryId!: number;

    @ApiProperty({ example: '2026-09', description: 'Format YYYY-MM' })
    @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in format YYYY-MM' })
    month!: string;

    @ApiProperty({ example: 15000 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    limitAmount!: number;
}