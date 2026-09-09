import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsEnum, IsOptional, IsString, IsDateString, IsArray } from 'class-validator';
import { TransactionType } from '@common/enums';

export class CreateTransactionDto {
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

    @ApiProperty()
    @IsDateString()
    date!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ type: [Number], example: [1, 2] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    tagIds?: number[];
}