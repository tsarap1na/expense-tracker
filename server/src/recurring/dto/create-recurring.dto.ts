import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsEnum, IsOptional, IsString, IsDateString, IsBoolean, MaxLength } from 'class-validator';
import { TransactionType } from '@common/enums';
import { Frequency } from '../models/recurring.model';

export class CreateRecurringDto {
    @ApiProperty()
    @IsInt()
    @IsPositive()
    categoryId!: number;

    @ApiProperty()
    @IsPositive()
    amount!: number;

    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    type!: TransactionType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    description?: string;

    @ApiProperty({ enum: Frequency })
    @IsEnum(Frequency)
    frequency!: Frequency;

    @ApiProperty()
    @IsDateString()
    nextRunAt!: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}