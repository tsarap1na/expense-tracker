import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { TransactionType } from '@common/enums';

export class CreateTransactionDto {
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
}